import { MeshTxBuilder, deserializeAddress } from "@meshsdk/core";
import type { UTxO, Asset } from "@meshsdk/core";
import { getProvider } from "../provider";
import { getScript, getDerived } from "../scripts";
import { NETWORK } from "../constants";
import {
  COUNT_REDEEMER,
  BURN_REDEEMER,
  TALLY_COUNT_REDEEMER,
  parseVoteDatum,
  rebuildTallyStateDatum,
} from "../types";

export interface CountVotesParams {
  /** The connected wallet's bech32 address */
  walletAddress: string;
  /** Wallet UTxOs for coin selection */
  walletUtxos: UTxO[];
  /** Collateral UTxO from the wallet */
  collateralUtxo: UTxO;
  /** Hex token name of the proposal's tally NFT */
  proposalTokenName: string;
  /** Tally UTxO tx hash */
  tallyTxHash: string;
  /** Tally UTxO output index */
  tallyOutputIndex: number;
}

/**
 * Build an unsigned transaction that aggregates vote UTxOs into the tally.
 *
 * The transaction:
 * 1. Spends the tally UTxO (with TALLY_COUNT_REDEEMER on tallyValidator)
 * 2. Spends all vote UTxOs for this proposal (with COUNT_REDEEMER on voteValidator)
 * 3. Burns all vote NFTs (with BURN_REDEEMER on voteMinter)
 * 4. Outputs updated tally UTxO with new votesFor/votesAgainst
 * 5. References the configuration UTxO
 *
 * @returns The unsigned transaction hex
 */
export async function buildCountVotesTx(
  params: CountVotesParams,
): Promise<string> {
  const provider = getProvider();
  const derived = getDerived();

  // 1. Fetch the tally UTxO
  const tallyUtxos = await provider.fetchAddressUTxOs(
    derived.tallyValidatorAddress,
  );
  const tallyUtxo = tallyUtxos.find(
    (u) =>
      u.input.txHash === params.tallyTxHash &&
      u.input.outputIndex === params.tallyOutputIndex,
  );
  if (!tallyUtxo) {
    throw new Error("Tally UTxO not found. It may have been spent already.");
  }

  // 2. Fetch all vote UTxOs for this proposal
  const allVoteUtxos = await provider.fetchAddressUTxOs(
    derived.voteValidatorAddress,
  );
  const proposalVoteUtxos = allVoteUtxos.filter((u) =>
    u.output.amount.some(
      (a) =>
        a.unit === derived.voteMinterPolicyId + params.proposalTokenName &&
        Number(a.quantity) > 0,
    ),
  );

  if (proposalVoteUtxos.length === 0) {
    throw new Error("No vote UTxOs found for this proposal.");
  }

  // 3. Parse vote datums to count for/against
  let newForCount = 0;
  let newAgainstCount = 0;

  for (const voteUtxo of proposalVoteUtxos) {
    const voteDatum = parseVoteDatum(voteUtxo.output.plutusData);
    if (voteDatum) {
      if (voteDatum.direction === "for") newForCount++;
      else newAgainstCount++;
    }
  }

  // 4. Get existing vote counts from tally datum and add new counts
  const existingDatum = tallyUtxo.output.plutusData;
  if (!existingDatum) {
    throw new Error("Tally UTxO has no inline datum");
  }
  const existing = existingDatum as unknown as {
    constructor?: number;
    fields?: unknown[];
  };
  const existingFor = Number(
    (existing.fields?.[2] as { int?: number })?.int ?? existing.fields?.[2] ?? 0,
  );
  const existingAgainst = Number(
    (existing.fields?.[3] as { int?: number })?.int ?? existing.fields?.[3] ?? 0,
  );

  const updatedTallyDatum = rebuildTallyStateDatum(
    existingDatum,
    existingFor + newForCount,
    existingAgainst + newAgainstCount,
  );

  // 5. Find the Configuration UTxO (read-only reference)
  const configUtxos = await provider.fetchAddressUTxOs(
    derived.configurationAddress,
  );
  if (configUtxos.length === 0) {
    throw new Error("No Configuration UTxO found.");
  }
  const configUtxo = configUtxos[0];

  // 6. Get scripts
  const tallyValidatorScript = getScript("tallyValidator");
  const voteValidatorScript = getScript("voteValidator");
  const voteMinterScript = getScript("voteMinter");

  // 7. Get signer pub key hash
  const { pubKeyHash } = deserializeAddress(params.walletAddress);

  // 8. Build the transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
    verbose: false,
  });

  txBuilder.setNetwork(NETWORK as "preprod" | "mainnet" | "preview");

  // --- Spend the Tally UTxO ---
  txBuilder
    .spendingPlutusScriptV2()
    .txIn(
      tallyUtxo.input.txHash,
      tallyUtxo.input.outputIndex,
      tallyUtxo.output.amount,
      tallyUtxo.output.address,
    )
    .txInScript(tallyValidatorScript.code)
    .txInInlineDatumPresent()
    .txInRedeemerValue(TALLY_COUNT_REDEEMER);

  // --- Spend each Vote UTxO ---
  for (const voteUtxo of proposalVoteUtxos) {
    txBuilder
      .spendingPlutusScriptV2()
      .txIn(
        voteUtxo.input.txHash,
        voteUtxo.input.outputIndex,
        voteUtxo.output.amount,
        voteUtxo.output.address,
      )
      .txInScript(voteValidatorScript.code)
      .txInInlineDatumPresent()
      .txInRedeemerValue(COUNT_REDEEMER);
  }

  // --- Read-only: Configuration UTxO ---
  txBuilder.readOnlyTxInReference(
    configUtxo.input.txHash,
    configUtxo.input.outputIndex,
  );

  // --- Burn all vote NFTs ---
  txBuilder
    .mintPlutusScriptV2()
    .mint(
      (-proposalVoteUtxos.length).toString(),
      derived.voteMinterPolicyId,
      params.proposalTokenName,
    )
    .mintingScript(voteMinterScript.code)
    .mintRedeemerValue(BURN_REDEEMER);

  // --- Output: Updated Tally UTxO ---
  const tallyOutputAssets: Asset[] = tallyUtxo.output.amount.map((a) => ({
    unit: a.unit,
    quantity: a.quantity,
  }));
  txBuilder
    .txOut(derived.tallyValidatorAddress, tallyOutputAssets)
    .txOutInlineDatumValue(updatedTallyDatum);

  // --- Collateral ---
  txBuilder.txInCollateral(
    params.collateralUtxo.input.txHash,
    params.collateralUtxo.input.outputIndex,
    params.collateralUtxo.output.amount,
    params.collateralUtxo.output.address,
  );

  // --- Required signer ---
  txBuilder.requiredSignerHash(pubKeyHash);

  // --- Change address & UTxO selection ---
  txBuilder
    .changeAddress(params.walletAddress)
    .selectUtxosFrom(params.walletUtxos);

  // --- Build ---
  const unsignedTx = await txBuilder.complete();
  return unsignedTx;
}
