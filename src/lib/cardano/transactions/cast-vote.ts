import { MeshTxBuilder, deserializeAddress } from "@meshsdk/core";
import type { UTxO, Asset } from "@meshsdk/core";
import { getProvider } from "../provider";
import { getScript, getDerived } from "../scripts";
import { NETWORK } from "../constants";
import { buildVoteDatum, MINT_REDEEMER } from "../types";

export interface CastVoteParams {
  /** The connected wallet's bech32 address */
  walletAddress: string;
  /** Wallet UTxOs for coin selection */
  walletUtxos: UTxO[];
  /** Collateral UTxO from the wallet */
  collateralUtxo: UTxO;
  /** Hex token name of the proposal's tally NFT */
  proposalTokenName: string;
  /** Vote direction */
  voteDirection: "for" | "against";
  /** Tally UTxO tx hash (for read-only reference) */
  tallyTxHash: string;
  /** Tally UTxO output index */
  tallyOutputIndex: number;
}

/**
 * Build an unsigned transaction that casts a vote on an existing proposal.
 *
 * The transaction:
 * 1. References the tally UTxO as read-only input (proves proposal exists)
 * 2. References the configuration UTxO as read-only input
 * 3. Mints a vote NFT (token name = proposal's tally NFT token name)
 * 4. Outputs vote UTxO at vote validator with VoteDatum + vote NFT
 *
 * @returns The unsigned transaction hex
 */
export async function buildCastVoteTx(
  params: CastVoteParams,
): Promise<string> {
  const provider = getProvider();
  const derived = getDerived();

  // 1. Find the Configuration UTxO (read-only reference)
  const configUtxos = await provider.fetchAddressUTxOs(
    derived.configurationAddress,
  );
  if (configUtxos.length === 0) {
    throw new Error(
      "No Configuration UTxO found. The DAO may not be initialized on this network.",
    );
  }
  const configUtxo = configUtxos[0];

  // 2. Build the vote datum
  const voteDatum = buildVoteDatum(
    params.voteDirection,
    params.walletAddress,
  );

  // 3. Get scripts
  const voteMinterScript = getScript("voteMinter");

  // 4. Get the voter's pub key hash for requiredSignerHash
  const { pubKeyHash } = deserializeAddress(params.walletAddress);

  // 5. Build the transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
    verbose: false,
  });

  txBuilder.setNetwork(NETWORK as "preprod" | "mainnet" | "preview");

  // --- Read-only: Tally UTxO (proves proposal exists) ---
  txBuilder.readOnlyTxInReference(
    params.tallyTxHash,
    params.tallyOutputIndex,
  );

  // --- Read-only: Configuration UTxO ---
  txBuilder.readOnlyTxInReference(
    configUtxo.input.txHash,
    configUtxo.input.outputIndex,
  );

  // --- Mint the Vote NFT ---
  txBuilder
    .mintPlutusScriptV2()
    .mint("1", derived.voteMinterPolicyId, params.proposalTokenName)
    .mintingScript(voteMinterScript.code)
    .mintRedeemerValue(MINT_REDEEMER);

  // --- Output: Vote UTxO at vote validator ---
  const voteOutputAssets: Asset[] = [
    { unit: "lovelace", quantity: "2000000" }, // min ADA for UTxO
    {
      unit: derived.voteMinterPolicyId + params.proposalTokenName,
      quantity: "1",
    },
  ];
  txBuilder
    .txOut(derived.voteValidatorAddress, voteOutputAssets)
    .txOutInlineDatumValue(voteDatum);

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
