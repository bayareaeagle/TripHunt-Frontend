import {
  serializePlutusScript,
  resolveScriptHash,
} from "@meshsdk/core";
import type { PlutusScript } from "@meshsdk/core";
import { NETWORK } from "./constants";

// --- Raw .plutus JSON imports (cardano-cli envelope format) ---
import configurationNftJson from "./scripts/configuration-nft.json";
import configurationJson from "./scripts/configuration.json";
import indexValidatorJson from "./scripts/index-validator.json";
import tallyIndexJson from "./scripts/tally-index.json";
import tallyNftJson from "./scripts/tally-nft.json";
import tallyValidatorJson from "./scripts/tally-validator.json";
import treasuryValidatorJson from "./scripts/treasury-validator.json";
import voteMinterJson from "./scripts/vote-minter.json";
import voteValidatorJson from "./scripts/vote-validator.json";

interface PlutusEnvelope {
  type: string;
  description: string;
  cborHex: string;
}

const networkId = NETWORK === "mainnet" ? 1 : 0;

/** Convert a cardano-cli .plutus envelope to a MeshSDK PlutusScript */
function toPlutusScript(envelope: PlutusEnvelope): PlutusScript {
  return { version: "V2", code: envelope.cborHex };
}

// --- PlutusScript instances (lazy-cached) ---

let _scripts: Record<string, PlutusScript> | null = null;

function getScripts() {
  if (!_scripts) {
    _scripts = {
      configurationNft: toPlutusScript(configurationNftJson as PlutusEnvelope),
      configuration: toPlutusScript(configurationJson as PlutusEnvelope),
      indexValidator: toPlutusScript(indexValidatorJson as PlutusEnvelope),
      tallyIndex: toPlutusScript(tallyIndexJson as PlutusEnvelope),
      tallyNft: toPlutusScript(tallyNftJson as PlutusEnvelope),
      tallyValidator: toPlutusScript(tallyValidatorJson as PlutusEnvelope),
      treasuryValidator: toPlutusScript(treasuryValidatorJson as PlutusEnvelope),
      voteMinter: toPlutusScript(voteMinterJson as PlutusEnvelope),
      voteValidator: toPlutusScript(voteValidatorJson as PlutusEnvelope),
    };
  }
  return _scripts;
}

// --- Derived addresses and policy IDs (lazy-cached) ---

let _derived: {
  tallyNftPolicyId: string;
  tallyIndexPolicyId: string;
  configurationNftPolicyId: string;
  voteMinterPolicyId: string;
  indexValidatorAddress: string;
  tallyValidatorAddress: string;
  configurationAddress: string;
  voteValidatorAddress: string;
  treasuryValidatorAddress: string;
} | null = null;

export function getDerived() {
  if (!_derived) {
    const s = getScripts();

    _derived = {
      // Policy IDs (from minting scripts)
      tallyNftPolicyId: resolveScriptHash(s.tallyNft.code, "V2"),
      tallyIndexPolicyId: resolveScriptHash(s.tallyIndex.code, "V2"),
      configurationNftPolicyId: resolveScriptHash(s.configurationNft.code, "V2"),
      voteMinterPolicyId: resolveScriptHash(s.voteMinter.code, "V2"),

      // Validator addresses (from spending scripts)
      indexValidatorAddress: serializePlutusScript(
        s.indexValidator,
        undefined,
        networkId,
      ).address,
      tallyValidatorAddress: serializePlutusScript(
        s.tallyValidator,
        undefined,
        networkId,
      ).address,
      configurationAddress: serializePlutusScript(
        s.configuration,
        undefined,
        networkId,
      ).address,
      voteValidatorAddress: serializePlutusScript(
        s.voteValidator,
        undefined,
        networkId,
      ).address,
      treasuryValidatorAddress: serializePlutusScript(
        s.treasuryValidator,
        undefined,
        networkId,
      ).address,
    };
  }
  return _derived;
}

/** Get a specific PlutusScript by name */
export function getScript(
  name:
    | "configurationNft"
    | "configuration"
    | "indexValidator"
    | "tallyIndex"
    | "tallyNft"
    | "tallyValidator"
    | "treasuryValidator"
    | "voteMinter"
    | "voteValidator",
): PlutusScript {
  return getScripts()[name];
}
