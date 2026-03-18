import { MeshTxBuilder, deserializeAddress } from "@meshsdk/core";
import type { UTxO, Asset } from "@meshsdk/core";
import { getProvider } from "../provider";
import { getScript, getDerived } from "../scripts";
import { NETWORK } from "../constants";
import { TREASURY_DISBURSE_REDEEMER, parseTallyStateDatum } from "../types";

export interface DisburseTreasuryParams {
  /** The connected wallet's bech32 address */
  walletAddress: string;
  /** Wallet UTxOs for coin selection */
  walletUtxos: UTxO[];
  /** Collateral UTxO from the wallet */
  collateralUtxo: UTxO;
  /** Tally UTxO tx hash (proves proposal passed) */
  tallyTxHash: string;
  /** Tally UTxO output index */
  tallyOutputIndex: number;
  /** Traveler's bech32 address (funds recipient) */
  travelerAddress: string;
  /** Amount to disburse in lovelace */
  disbursementLovelace: number;
}

/**
 * Build an unsigned transaction that disburses treasury funds to a traveler
 * after their proposal has passed the vote threshold.
 *
 * The transaction:
 * 1. Spends the treasury UTxO (with TREASURY_DISBURSE_REDEEMER)
 * 2. References the tally UTxO (proves proposal passed)
 * 3. References the configuration UTxO
 * 4. Outputs disbursement to the traveler
 * 5. Returns remaining funds to treasury validator
 *
 * @returns The unsigned transaction hex
 */
export async function buildDisburseTreasuryTx(
  params: DisburseTreasuryParams,
): Promise<string> {
  const provider = getProvider();
  const derived = getDerived();

  // 1. Find the treasury UTxO (the one with the most ADA)
  const treasuryUtxos = await provider.fetchAddressUTxOs(
    derived.treasuryValidatorAddress,
  );
  if (treasuryUtxos.length === 0) {
    throw new Error("No treasury UTxO found. The treasury may be empty.");
  }

  // Pick the treasury UTxO with the most lovelace
  const treasuryUtxo = treasuryUtxos.reduce((best, current) => {
    const bestAda = Number(
      best.output.amount.find((a) => a.unit === "lovelace")?.quantity ?? "0",
    );
    const currentAda = Number(
      current.output.amount.find((a) => a.unit === "lovelace")?.quantity ?? "0",
    );
    return currentAda > bestAda ? current : best;
  });

  const treasuryLovelace = Number(
    treasuryUtxo.output.amount.find((a) => a.unit === "lovelace")?.quantity ?? "0",
  );

  // Verify treasury has enough funds (disbursement + min ADA for return UTxO)
  const minReturnAda = 2_000_000;
  if (treasuryLovelace < params.disbursementLovelace + minReturnAda) {
    throw new Error(
      `Insufficient treasury funds. Available: ${(treasuryLovelace / 1_000_000).toFixed(2)} ADA, ` +
      `Needed: ${((params.disbursementLovelace + minReturnAda) / 1_000_000).toFixed(2)} ADA`,
    );
  }

  // 2. Verify the tally UTxO exists and the proposal passed
  const tallyUtxos = await provider.fetchAddressUTxOs(
    derived.tallyValidatorAddress,
  );
  const tallyUtxo = tallyUtxos.find(
    (u) =>
      u.input.txHash === params.tallyTxHash &&
      u.input.outputIndex === params.tallyOutputIndex,
  );
  if (!tallyUtxo) {
    throw new Error("Tally UTxO not found.");
  }

  const tallyState = parseTallyStateDatum(tallyUtxo.output.plutusData);
  if (!tallyState) {
    throw new Error("Could not parse tally datum.");
  }

  // Verify proposal has passed (more for votes than against)
  if (tallyState.votesFor <= tallyState.votesAgainst) {
    throw new Error(
      `Proposal has not passed. Votes for: ${tallyState.votesFor}, against: ${tallyState.votesAgainst}`,
    );
  }

  // Verify voting period has ended
  if (tallyState.proposalEndTimePosix > Date.now()) {
    throw new Error("Voting period has not ended yet.");
  }

  // 3. Find the Configuration UTxO (read-only reference)
  const configUtxos = await provider.fetchAddressUTxOs(
    derived.configurationAddress,
  );
  if (configUtxos.length === 0) {
    throw new Error("No Configuration UTxO found.");
  }
  const configUtxo = configUtxos[0];

  // 4. Get scripts
  const treasuryScript = getScript("treasuryValidator");

  // 5. Get signer pub key hash
  const { pubKeyHash } = deserializeAddress(params.walletAddress);

  // 6. Build the transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
    verbose: false,
  });

  txBuilder.setNetwork(NETWORK as "preprod" | "mainnet" | "preview");

  // --- Spend the Treasury UTxO ---
  txBuilder
    .spendingPlutusScriptV2()
    .txIn(
      treasuryUtxo.input.txHash,
      treasuryUtxo.input.outputIndex,
      treasuryUtxo.output.amount,
      treasuryUtxo.output.address,
    )
    .txInScript(treasuryScript.code)
    .txInInlineDatumPresent()
    .txInRedeemerValue(TREASURY_DISBURSE_REDEEMER);

  // --- Read-only: Tally UTxO (proves proposal passed) ---
  txBuilder.readOnlyTxInReference(
    tallyUtxo.input.txHash,
    tallyUtxo.input.outputIndex,
  );

  // --- Read-only: Configuration UTxO ---
  txBuilder.readOnlyTxInReference(
    configUtxo.input.txHash,
    configUtxo.input.outputIndex,
  );

  // --- Output: Disbursement to traveler ---
  txBuilder.txOut(params.travelerAddress, [
    { unit: "lovelace", quantity: params.disbursementLovelace.toString() },
  ]);

  // --- Output: Return remaining funds to treasury ---
  const remainingLovelace = treasuryLovelace - params.disbursementLovelace;
  if (remainingLovelace >= minReturnAda) {
    // Preserve any non-ADA tokens in the treasury UTxO
    const returnAssets: Asset[] = [
      { unit: "lovelace", quantity: remainingLovelace.toString() },
    ];
    for (const asset of treasuryUtxo.output.amount) {
      if (asset.unit !== "lovelace") {
        returnAssets.push({ unit: asset.unit, quantity: asset.quantity });
      }
    }
    txBuilder
      .txOut(derived.treasuryValidatorAddress, returnAssets)
      .txOutInlineDatumValue({ alternative: 0, fields: [] }); // empty treasury datum
  }

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
