import * as xrpl from "xrpl";
import dotenv from "dotenv";
dotenv.config();
import { XummSdk } from "xumm-sdk";

const XRPL_ENDPOINT = process.env.XRPL_ENDPOINT!;
if (!XRPL_ENDPOINT) {
  throw new Error("XRPL_ENDPOINT is not defined in the environment variables.");
}

const client = new xrpl.Client(XRPL_ENDPOINT);

// Xumm SDK Initialization
const xummSdk = new XummSdk(
  process.env.XUMM_API_KEY!,
  process.env.XUMM_API_SECRET!
);

// Connects to the XRPL client if it is not already connected
async function connectClient() {
  if (!client.isConnected()) {
    await client.connect();
  }
}

// Disconnects the XRPL client if it is connected
async function disconnectClient() {
  if (client.isConnected()) {
    await client.disconnect();
  }
}

// Retrieves account information from the XRPL network
export async function getAccountInfo(address: string) {
  await connectClient();
  try {
    const response = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get account info: ${errorMessage}`);
  } finally {
    await disconnectClient();
  }
}

// Retrieves the balance of an account from the XRPL network
export async function getAccountBalance(address: string) {
  await connectClient();
  try {
    const response = await client.getBalances(address);
    if (response.length === 0) {
      throw new Error(`No balances found for account: ${address}`);
    }
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get account balance: ${errorMessage}`);
  } finally {
    await disconnectClient();
  }
}

// Retrieves NFTs owned by an account from the XRPL network
export async function getAccountNFTs(address: string) {
  await connectClient();
  try {
    const response = await client.request({
      command: "account_nfts",
      account: address,
      ledger_index: "validated",
    });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get account NFTs: ${errorMessage}`);
  } finally {
    await disconnectClient();
  }
}

// Retrieves the token ID of NFT from a transaction on the XRPL network
export async function getNFTTokenIdFromTx(txid: string): Promise<string | null> {
  await connectClient();
  try {
    const response = await client.request({
      command: "tx",
      transaction: txid,
      binary: false,
      api_version: 2
    });
    if (!response.result || !response.result.meta) {
      throw new Error(`Transaction ${txid} not found or has no metadata.`);
    }

    const txType = response.result.tx_json?.TransactionType;
    if (txType === "NFTokenMint") {
      const meta = response.result.meta;
      // Check if meta is an object and has nftoken_id property
      const nftTokenId = typeof meta === "object" && meta !== null && "nftoken_id" in meta
        ? meta.nftoken_id
        : undefined;
      if (!nftTokenId) {
        throw new Error(`No NFT token ID found in minted transaction ${txid}.`);
      }
      return nftTokenId;
    } else {
      throw new Error(`Transaction ${txid} is not an NFTokenMint transaction.`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get NFT token IDs: ${errorMessage}`);
  } finally {
    await disconnectClient();
  }
}

export { xummSdk };