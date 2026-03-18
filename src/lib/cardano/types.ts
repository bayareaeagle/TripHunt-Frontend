import { deserializeAddress } from "@meshsdk/core";
import type { Data } from "@meshsdk/common";

// ---------------------------------------------------------------------------
// Plutus Address encoding
// ---------------------------------------------------------------------------

/**
 * Convert a bech32 Cardano address into its Plutus Data representation.
 *
 * Plutus Address = constr(0, [credential, maybeStakingCredential])
 *   credential (PubKeyCredential) = constr(0, [pubKeyHashBytes])
 *   credential (ScriptCredential) = constr(1, [scriptHashBytes])
 *   maybeStakingCredential:
 *     Nothing = constr(1, [])
 *     Just(StakingHash(cred)) = constr(0, [constr(0, [cred])])
 */
export function addressToPlutusData(bech32: string): Data {
  const deserialized = deserializeAddress(bech32);

  // Payment credential
  let paymentCred: Data;
  if (deserialized.pubKeyHash) {
    paymentCred = { alternative: 0, fields: [deserialized.pubKeyHash] };
  } else if (deserialized.scriptHash) {
    paymentCred = { alternative: 1, fields: [deserialized.scriptHash] };
  } else {
    throw new Error(`Cannot extract payment credential from address: ${bech32}`);
  }

  // Staking credential (optional)
  let stakingCred: Data;
  if (deserialized.stakeCredentialHash) {
    // Just(StakingHash(PubKeyCredential(hash)))
    stakingCred = {
      alternative: 0,
      fields: [
        {
          alternative: 0,
          fields: [
            { alternative: 0, fields: [deserialized.stakeCredentialHash] },
          ],
        },
      ],
    };
  } else if (deserialized.stakeScriptCredentialHash) {
    // Just(StakingHash(ScriptCredential(hash)))
    stakingCred = {
      alternative: 0,
      fields: [
        {
          alternative: 0,
          fields: [
            { alternative: 1, fields: [deserialized.stakeScriptCredentialHash] },
          ],
        },
      ],
    };
  } else {
    // Nothing
    stakingCred = { alternative: 1, fields: [] };
  }

  return { alternative: 0, fields: [paymentCred, stakingCred] };
}

// ---------------------------------------------------------------------------
// ProposalType — Trip variant
// ---------------------------------------------------------------------------

/**
 * Build a Trip ProposalType datum.
 *
 * From Proposal.lbf:
 *   Trip = constructor 2, fields: [agentAddress, travelerAddress, totalCost]
 *
 * constructor indices: Upgrade=0, General=1, Trip=2
 */
export function buildTripProposal(
  agentAddress: string,
  travelerAddress: string,
  totalCostLovelace: number,
): Data {
  return {
    alternative: 2,
    fields: [
      addressToPlutusData(agentAddress),
      addressToPlutusData(travelerAddress),
      totalCostLovelace,
    ],
  };
}

// ---------------------------------------------------------------------------
// TallyStateDatum
// ---------------------------------------------------------------------------

/**
 * Build the full TallyStateDatum for a new trip proposal.
 *
 * From Tally.lbf:
 *   TallyStateDatum = constr(0, [proposal, proposalEndTime, votesFor, votesAgainst])
 *
 * New proposals start with 0 votes for and 0 votes against.
 */
export function buildTallyStateDatum(
  agentAddress: string,
  travelerAddress: string,
  totalCostLovelace: number,
  proposalEndTimePosix: number,
): Data {
  return {
    alternative: 0,
    fields: [
      buildTripProposal(agentAddress, travelerAddress, totalCostLovelace),
      proposalEndTimePosix,
      0, // votes for
      0, // votes against
    ],
  };
}

// ---------------------------------------------------------------------------
// IndexDatum
// ---------------------------------------------------------------------------

/**
 * Build an IndexDatum.
 *
 * From Index.lbf:
 *   IndexDatum = constr(0, [index])
 */
export function buildIndexDatum(index: number): Data {
  return { alternative: 0, fields: [index] };
}

// ---------------------------------------------------------------------------
// Redeemers
// ---------------------------------------------------------------------------

/** Mint redeemer for tally NFT minting policy — VoteMinterActionRedeemer.Mint */
export const MINT_REDEEMER: Data = { alternative: 0, fields: [] };

/** Burn redeemer — VoteMinterActionRedeemer.Burn */
export const BURN_REDEEMER: Data = { alternative: 1, fields: [] };

/** Count redeemer — VoteActionRedeemer.Count (for vote validator) */
export const COUNT_REDEEMER: Data = { alternative: 0, fields: [] };

/** Cancel redeemer — VoteActionRedeemer.Cancel (for vote validator) */
export const CANCEL_REDEEMER: Data = { alternative: 1, fields: [] };

/** Tally validator count redeemer — TallyActionRedeemer.Count */
export const TALLY_COUNT_REDEEMER: Data = { alternative: 0, fields: [] };

/** Treasury validator disburse redeemer */
export const TREASURY_DISBURSE_REDEEMER: Data = { alternative: 0, fields: [] };

// ---------------------------------------------------------------------------
// VoteDatum
// ---------------------------------------------------------------------------

/**
 * Build a VoteDatum for casting a vote on a proposal.
 *
 * From Vote.lbf:
 *   VoteDatum = constr(0, [voteDirection, returnAddress])
 *   VoteDirection: For = constr(0, []), Against = constr(1, [])
 */
export function buildVoteDatum(
  direction: "for" | "against",
  voterAddress: string,
): Data {
  const voteDirection: Data =
    direction === "for"
      ? { alternative: 0, fields: [] }
      : { alternative: 1, fields: [] };

  return {
    alternative: 0,
    fields: [voteDirection, addressToPlutusData(voterAddress)],
  };
}

// ---------------------------------------------------------------------------
// TallyStateDatum parser
// ---------------------------------------------------------------------------

export interface ParsedTallyState {
  /** Raw proposal type data (Trip variant) */
  proposal: {
    agentPkh: string;
    travelerPkh: string;
    totalCostLovelace: number;
  };
  proposalEndTimePosix: number;
  votesFor: number;
  votesAgainst: number;
}

/**
 * Parse a TallyStateDatum from an inline datum.
 *
 * TallyStateDatum = constr(0, [proposal, proposalEndTime, votesFor, votesAgainst])
 * Trip proposal   = constr(2, [agentAddress, travelerAddress, totalCost])
 * PlutusAddress   = constr(0, [credential, stakingCred])
 * PubKeyCredential = constr(0, [pubKeyHashBytes])
 */
export function parseTallyStateDatum(
  plutusData: unknown,
): ParsedTallyState | null {
  try {
    const datum = plutusData as {
      constructor?: number;
      fields?: unknown[];
    };
    if (!datum || datum.constructor !== 0 || !datum.fields) return null;

    const [proposal, endTime, votesFor, votesAgainst] = datum.fields;

    // Parse proposal (Trip = constructor 2)
    const prop = proposal as { constructor?: number; fields?: unknown[] };
    let agentPkh = "";
    let travelerPkh = "";
    let totalCostLovelace = 0;

    if (prop && prop.fields) {
      agentPkh = extractPkhFromPlutusAddress(prop.fields[0]);
      travelerPkh = extractPkhFromPlutusAddress(prop.fields[1]);
      totalCostLovelace = Number(
        (prop.fields[2] as { int?: number })?.int ?? prop.fields[2] ?? 0,
      );
    }

    return {
      proposal: { agentPkh, travelerPkh, totalCostLovelace },
      proposalEndTimePosix: Number(
        (endTime as { int?: number })?.int ?? endTime ?? 0,
      ),
      votesFor: Number(
        (votesFor as { int?: number })?.int ?? votesFor ?? 0,
      ),
      votesAgainst: Number(
        (votesAgainst as { int?: number })?.int ?? votesAgainst ?? 0,
      ),
    };
  } catch {
    return null;
  }
}

/** Extract pubKeyHash from a Plutus Address data structure */
function extractPkhFromPlutusAddress(addrData: unknown): string {
  try {
    const addr = addrData as { constructor?: number; fields?: unknown[] };
    if (!addr || !addr.fields) return "";
    // Address = constr(0, [credential, stakingCred])
    const cred = addr.fields[0] as { constructor?: number; fields?: unknown[] };
    if (!cred || !cred.fields) return "";
    // PubKeyCredential = constr(0, [bytes])
    const hash = cred.fields[0];
    if (typeof hash === "string") return hash;
    if (typeof hash === "object" && hash !== null) {
      return (hash as { bytes?: string }).bytes ?? "";
    }
    return "";
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// VoteDatum parser
// ---------------------------------------------------------------------------

export interface ParsedVoteDatum {
  direction: "for" | "against";
  voterPkh: string;
}

/**
 * Parse a VoteDatum from an inline datum.
 * VoteDatum = constr(0, [voteDirection, returnAddress])
 */
export function parseVoteDatum(plutusData: unknown): ParsedVoteDatum | null {
  try {
    const datum = plutusData as {
      constructor?: number;
      fields?: unknown[];
    };
    if (!datum || datum.constructor !== 0 || !datum.fields) return null;

    const [directionData, addrData] = datum.fields;

    // Parse direction: For = constr(0, []), Against = constr(1, [])
    const dir = directionData as { constructor?: number };
    const direction: "for" | "against" =
      dir && dir.constructor === 0 ? "for" : "against";

    // Parse voter pkh from return address
    const voterPkh = extractPkhFromPlutusAddress(addrData);

    return { direction, voterPkh };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Updated TallyStateDatum builder (for count transaction)
// ---------------------------------------------------------------------------

/**
 * Rebuild a TallyStateDatum with updated vote counts.
 * Preserves the original proposal and endTime from the existing datum,
 * only updating votesFor and votesAgainst.
 */
export function rebuildTallyStateDatum(
  originalDatum: unknown,
  newVotesFor: number,
  newVotesAgainst: number,
): Data {
  const orig = originalDatum as {
    constructor?: number;
    fields?: unknown[];
  };

  if (!orig || !orig.fields || orig.fields.length < 4) {
    throw new Error("Invalid tally datum: cannot rebuild");
  }

  // Preserve the original proposal and endTime, update vote counts
  return {
    alternative: 0,
    fields: [
      orig.fields[0] as Data, // proposal (unchanged)
      orig.fields[1] as Data, // proposalEndTime (unchanged)
      newVotesFor,
      newVotesAgainst,
    ],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a proposal index number to its hex token name */
export function indexToTokenName(index: number): string {
  return index.toString(16).padStart(2, "0");
}
