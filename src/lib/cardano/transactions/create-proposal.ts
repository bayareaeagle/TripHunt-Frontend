import { MeshTxBuilder, deserializeAddress } from "@meshsdk/core";
import type { UTxO, Asset } from "@meshsdk/core";
import { getProvider } from "../provider";
import { getScript, getDerived } from "../scripts";
import { NETWORK } from "../constants";
import {
  buildTallyStateDatum,
  buildIndexDatum,
  MINT_REDEEMER,
  indexToTokenName,
} from "../types";

export interface CreateProposalParams {
  /** The connected browser wallet instance (CIP-30) */
  walletAddress: string;
  /** Wallet UTxOs for coin selection */
  walletUtxos: UTxO[];
  /** Travel agent's bech32 address */
  agentAddress: string;
  /** Traveler's bech32 address (usually the connected wallet) */
  travelerAddress: string;
  /** Trip cost in lovelace */
  totalCostLovelace: number;
  /** Proposal end time as POSIX timestamp in milliseconds */
  proposalEndTimePosix: number;
  /** Platform fee in lovelace */
  feeLovelace: number;
  /** Address to receive the platform fee */
  feeAddress: string;
  /** Collateral UTxO from the wallet */
  collateralUtxo: UTxO;
}

/**
 * Build an unsigned transaction that creates a new trip proposal on-chain.
 *
 * The transaction:
 * 1. Spends the current Index UTxO to increment the proposal counter
 * 2. Mints a tally NFT (token name = hex of new index)
 * 3. Outputs new Index UTxO with incremented IndexDatum
 * 4. Outputs Tally UTxO with TallyStateDatum containing trip details
 * 5. References the Configuration UTxO as a read-only input
 * 6. Sends platform fee to the fee address
 *
 * @returns The unsigned transaction hex
 */
export async function buildCreateProposalTx(
  params: CreateProposalParams,
): Promise<string> {
  const provider = getProvider();
  const derived = getDerived();

  // 1. Find the current Index UTxO
  const indexUtxos = await provider.fetchAddressUTxOs(
    derived.indexValidatorAddress,
  );
  if (indexUtxos.length === 0) {
    throw new Error(
      "No Index UTxO found. The DAO may not be initialized on this network.",
    );
  }
  const indexUtxo = indexUtxos[0];

  // Parse the current index from the inline datum
  const currentIndex = parseIndexFromUtxo(indexUtxo);
  const newIndex = currentIndex + 1;
  const tokenName = indexToTokenName(newIndex);

  // 2. Find the Configuration UTxO (read-only reference)
  const configUtxos = await provider.fetchAddressUTxOs(
    derived.configurationAddress,
  );
  if (configUtxos.length === 0) {
    throw new Error(
      "No Configuration UTxO found. The DAO may not be initialized on this network.",
    );
  }
  const configUtxo = configUtxos[0];

  // 3. Build datums
  const newIndexDatum = buildIndexDatum(newIndex);
  const tallyDatum = buildTallyStateDatum(
    params.agentAddress,
    params.travelerAddress,
    params.totalCostLovelace,
    params.proposalEndTimePosix,
  );

  // 4. Get script CBOR hex
  const indexScript = getScript("indexValidator");
  const tallyNftScript = getScript("tallyNft");

  // 5. Get the proposer's pub key hash for requiredSignerHash
  const { pubKeyHash } = deserializeAddress(params.walletAddress);

  // 6. Build the transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
    verbose: false,
  });

  // Set network for cost model resolution
  txBuilder.setNetwork(NETWORK as "preprod" | "mainnet" | "preview");

  // --- Spend the Index UTxO ---
  txBuilder
    .spendingPlutusScriptV2()
    .txIn(
      indexUtxo.input.txHash,
      indexUtxo.input.outputIndex,
      indexUtxo.output.amount,
      indexUtxo.output.address,
    )
    .txInScript(indexScript.code)
    .txInInlineDatumPresent()
    .txInRedeemerValue(MINT_REDEEMER);

  // --- Read-only Configuration reference ---
  txBuilder.readOnlyTxInReference(
    configUtxo.input.txHash,
    configUtxo.input.outputIndex,
  );

  // --- Mint the Tally NFT ---
  txBuilder
    .mintPlutusScriptV2()
    .mint("1", derived.tallyNftPolicyId, tokenName)
    .mintingScript(tallyNftScript.code)
    .mintRedeemerValue(MINT_REDEEMER);

  // --- Output: Updated Index UTxO back to index validator ---
  const indexOutputAssets: Asset[] = indexUtxo.output.amount.map((a) => ({
    unit: a.unit,
    quantity: a.quantity,
  }));
  txBuilder
    .txOut(derived.indexValidatorAddress, indexOutputAssets)
    .txOutInlineDatumValue(newIndexDatum);

  // --- Output: New Tally UTxO at tally validator ---
  const tallyOutputAssets: Asset[] = [
    { unit: "lovelace", quantity: "2000000" }, // min ADA for UTxO
    {
      unit: derived.tallyNftPolicyId + tokenName,
      quantity: "1",
    },
  ];
  txBuilder
    .txOut(derived.tallyValidatorAddress, tallyOutputAssets)
    .txOutInlineDatumValue(tallyDatum);

  // --- Output: Platform fee ---
  if (params.feeLovelace > 0 && params.feeAddress) {
    txBuilder.txOut(params.feeAddress, [
      { unit: "lovelace", quantity: params.feeLovelace.toString() },
    ]);
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

/**
 * Parse the index integer from an Index UTxO's inline datum.
 * The datum is: constr(0, [integer])
 */
function parseIndexFromUtxo(utxo: UTxO): number {
  const plutusData = utxo.output.plutusData;
  if (!plutusData) {
    throw new Error("Index UTxO has no inline datum");
  }

  // MeshSDK may return the datum as a parsed object or as CBOR hex
  if (typeof plutusData === "object") {
    // Already parsed: { constructor: 0, fields: [{ int: N }] }
    const fields = (plutusData as Record<string, unknown>).fields as Array<
      Record<string, unknown>
    >;
    if (fields && fields.length > 0) {
      const val = fields[0].int ?? fields[0];
      return typeof val === "number" ? val : Number(val);
    }
  }

  // Fallback: assume index 0 if we can't parse
  console.warn("Could not parse index datum, defaulting to 0");
  return 0;
}

/**
 * Submit a signed transaction via Blockfrost.
 */
export async function submitTx(signedTxHex: string): Promise<string> {
  const provider = getProvider();
  const txHash = await provider.submitTx(signedTxHex);
  if (!txHash) {
    throw new Error("Transaction submission returned no hash");
  }
  return txHash;
}
