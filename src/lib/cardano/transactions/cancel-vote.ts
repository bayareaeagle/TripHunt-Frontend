import { MeshTxBuilder, deserializeAddress } from "@meshsdk/core";
import type { UTxO } from "@meshsdk/core";
import { getProvider } from "../provider";
import { getScript, getDerived } from "../scripts";
import { NETWORK } from "../constants";
import { CANCEL_REDEEMER, BURN_REDEEMER } from "../types";

export interface CancelVoteParams {
  /** The connected wallet's bech32 address */
  walletAddress: string;
  /** Wallet UTxOs for coin selection */
  walletUtxos: UTxO[];
  /** Collateral UTxO from the wallet */
  collateralUtxo: UTxO;
  /** Hex token name of the proposal's tally NFT (= vote NFT token name) */
  proposalTokenName: string;
  /** The specific vote UTxO tx hash to cancel */
  voteTxHash: string;
  /** The specific vote UTxO output index to cancel */
  voteOutputIndex: number;
}

/**
 * Build an unsigned transaction that cancels a user's vote and reclaims ADA.
 *
 * The transaction:
 * 1. Spends the vote UTxO (with CANCEL_REDEEMER on voteValidator)
 * 2. Burns the vote NFT (with BURN_REDEEMER on voteMinter)
 * 3. References the configuration UTxO
 * 4. Returns ADA to the voter's wallet via change
 *
 * @returns The unsigned transaction hex
 */
export async function buildCancelVoteTx(
  params: CancelVoteParams,
): Promise<string> {
  const provider = getProvider();
  const derived = getDerived();

  // 1. Fetch the vote UTxO
  const voteUtxos = await provider.fetchAddressUTxOs(
    derived.voteValidatorAddress,
  );
  const voteUtxo = voteUtxos.find(
    (u) =>
      u.input.txHash === params.voteTxHash &&
      u.input.outputIndex === params.voteOutputIndex,
  );
  if (!voteUtxo) {
    throw new Error("Vote UTxO not found. It may have already been counted or cancelled.");
  }

  // Verify the vote UTxO has the correct vote NFT
  const hasVoteNft = voteUtxo.output.amount.some(
    (a) =>
      a.unit === derived.voteMinterPolicyId + params.proposalTokenName &&
      Number(a.quantity) > 0,
  );
  if (!hasVoteNft) {
    throw new Error("Vote UTxO does not contain the expected vote NFT.");
  }

  // 2. Find the Configuration UTxO (read-only reference)
  const configUtxos = await provider.fetchAddressUTxOs(
    derived.configurationAddress,
  );
  if (configUtxos.length === 0) {
    throw new Error("No Configuration UTxO found.");
  }
  const configUtxo = configUtxos[0];

  // 3. Get scripts
  const voteValidatorScript = getScript("voteValidator");
  const voteMinterScript = getScript("voteMinter");

  // 4. Get signer pub key hash
  const { pubKeyHash } = deserializeAddress(params.walletAddress);

  // 5. Build the transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
    verbose: false,
  });

  txBuilder.setNetwork(NETWORK as "preprod" | "mainnet" | "preview");

  // --- Spend the Vote UTxO with Cancel redeemer ---
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
    .txInRedeemerValue(CANCEL_REDEEMER);

  // --- Read-only: Configuration UTxO ---
  txBuilder.readOnlyTxInReference(
    configUtxo.input.txHash,
    configUtxo.input.outputIndex,
  );

  // --- Burn the Vote NFT ---
  txBuilder
    .mintPlutusScriptV2()
    .mint("-1", derived.voteMinterPolicyId, params.proposalTokenName)
    .mintingScript(voteMinterScript.code)
    .mintRedeemerValue(BURN_REDEEMER);

  // --- Collateral ---
  txBuilder.txInCollateral(
    params.collateralUtxo.input.txHash,
    params.collateralUtxo.input.outputIndex,
    params.collateralUtxo.output.amount,
    params.collateralUtxo.output.address,
  );

  // --- Required signer ---
  txBuilder.requiredSignerHash(pubKeyHash);

  // --- Change address (reclaims the ADA from the vote UTxO) ---
  txBuilder
    .changeAddress(params.walletAddress)
    .selectUtxosFrom(params.walletUtxos);

  // --- Build ---
  const unsignedTx = await txBuilder.complete();
  return unsignedTx;
}
