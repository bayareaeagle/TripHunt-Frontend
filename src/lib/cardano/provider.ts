import { BlockfrostProvider } from "@meshsdk/core";
import { BLOCKFROST_API_KEY } from "./constants";

let _provider: BlockfrostProvider | null = null;

/**
 * Lazily create a singleton BlockfrostProvider.
 * The SDK infers the network (preprod/mainnet) from the API key prefix.
 * Must be called client-side only.
 */
export function getProvider(): BlockfrostProvider {
  if (!_provider) {
    if (!BLOCKFROST_API_KEY) {
      throw new Error(
        "NEXT_PUBLIC_BLOCKFROST_API_KEY is not set. Add it to .env.local",
      );
    }
    _provider = new BlockfrostProvider(BLOCKFROST_API_KEY);
  }
  return _provider;
}
