import { getProvider } from "../provider";
import { getDerived } from "../scripts";
import { parseTallyStateDatum, parseVoteDatum } from "../types";
import type { ParsedTallyState } from "../types";

export interface OnChainProposal {
  /** Tally UTxO tx hash */
  txHash: string;
  /** Tally UTxO output index */
  outputIndex: number;
  /** Hex token name of the tally NFT (used as proposal identifier) */
  tokenName: string;
  /** Parsed tally state */
  tallyState: ParsedTallyState;
}

/**
 * Fetch all proposals currently sitting at the tally validator.
 * Each UTxO at the tally validator address represents one proposal.
 */
export async function fetchActiveProposals(): Promise<OnChainProposal[]> {
  const provider = getProvider();
  const derived = getDerived();

  const utxos = await provider.fetchAddressUTxOs(
    derived.tallyValidatorAddress,
  );

  const proposals: OnChainProposal[] = [];

  for (const utxo of utxos) {
    // Parse the inline datum
    const tallyState = parseTallyStateDatum(utxo.output.plutusData);
    if (!tallyState) continue;

    // Find the tally NFT token name from the UTxO's assets
    let tokenName = "";
    for (const asset of utxo.output.amount) {
      if (
        asset.unit !== "lovelace" &&
        asset.unit.startsWith(derived.tallyNftPolicyId)
      ) {
        tokenName = asset.unit.slice(derived.tallyNftPolicyId.length);
        break;
      }
    }

    if (!tokenName) continue; // Skip UTxOs without a tally NFT

    proposals.push({
      txHash: utxo.input.txHash,
      outputIndex: utxo.input.outputIndex,
      tokenName,
      tallyState,
    });
  }

  return proposals;
}

/**
 * Check if a user has already voted on a specific proposal.
 * Looks for vote NFTs at the vote validator address that match the proposal
 * token name and have the voter's address in the datum.
 */
export async function hasUserVoted(
  proposalTokenName: string,
  walletPkh: string,
): Promise<boolean> {
  const provider = getProvider();
  const derived = getDerived();

  const voteUtxos = await provider.fetchAddressUTxOs(
    derived.voteValidatorAddress,
  );

  for (const utxo of voteUtxos) {
    // Check if this UTxO contains the vote NFT for this proposal
    const hasVoteNft = utxo.output.amount.some(
      (a) =>
        a.unit === derived.voteMinterPolicyId + proposalTokenName &&
        Number(a.quantity) > 0,
    );

    if (!hasVoteNft) continue;

    // Check if the datum's return address matches the voter
    const datum = utxo.output.plutusData as {
      constructor?: number;
      fields?: unknown[];
    } | undefined;

    if (datum && datum.fields && datum.fields.length >= 2) {
      // VoteDatum = constr(0, [voteDirection, returnAddress])
      // returnAddress = constr(0, [credential, stakingCred])
      // credential = constr(0, [pubKeyHash])
      const addrData = datum.fields[1] as {
        constructor?: number;
        fields?: unknown[];
      };
      if (addrData && addrData.fields) {
        const cred = addrData.fields[0] as {
          constructor?: number;
          fields?: unknown[];
        };
        if (cred && cred.fields) {
          const pkh = cred.fields[0];
          const pkhStr =
            typeof pkh === "string"
              ? pkh
              : (pkh as { bytes?: string })?.bytes ?? "";
          if (pkhStr === walletPkh) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export interface UserVoteUtxo {
  txHash: string;
  outputIndex: number;
  proposalTokenName: string;
  direction: "for" | "against";
}

/**
 * Fetch a user's vote UTxOs across all proposals.
 * Returns the UTxO reference and vote direction for each.
 */
export async function fetchUserVotes(
  walletPkh: string,
): Promise<UserVoteUtxo[]> {
  const provider = getProvider();
  const derived = getDerived();

  const voteUtxos = await provider.fetchAddressUTxOs(
    derived.voteValidatorAddress,
  );

  const results: UserVoteUtxo[] = [];

  for (const utxo of voteUtxos) {
    const voteDatum = parseVoteDatum(utxo.output.plutusData);
    if (!voteDatum || voteDatum.voterPkh !== walletPkh) continue;

    // Find the vote NFT token name
    let proposalTokenName = "";
    for (const asset of utxo.output.amount) {
      if (
        asset.unit !== "lovelace" &&
        asset.unit.startsWith(derived.voteMinterPolicyId)
      ) {
        proposalTokenName = asset.unit.slice(derived.voteMinterPolicyId.length);
        break;
      }
    }

    if (!proposalTokenName) continue;

    results.push({
      txHash: utxo.input.txHash,
      outputIndex: utxo.input.outputIndex,
      proposalTokenName,
      direction: voteDatum.direction,
    });
  }

  return results;
}

/**
 * Count the number of uncounted vote UTxOs for a specific proposal.
 */
export async function countPendingVotes(
  proposalTokenName: string,
): Promise<number> {
  const provider = getProvider();
  const derived = getDerived();

  const voteUtxos = await provider.fetchAddressUTxOs(
    derived.voteValidatorAddress,
  );

  return voteUtxos.filter((u) =>
    u.output.amount.some(
      (a) =>
        a.unit === derived.voteMinterPolicyId + proposalTokenName &&
        Number(a.quantity) > 0,
    ),
  ).length;
}
