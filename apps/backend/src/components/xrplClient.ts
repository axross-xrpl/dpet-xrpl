import * as xrpl from "xrpl";
import dotenv from "dotenv";
dotenv.config();

const XRPL_ENDPOINT = process.env.XRPL_ENDPOINT!;
if (!XRPL_ENDPOINT) {
  throw new Error("XRPL_ENDPOINT is not defined in the environment variables.");
}

const client = new xrpl.Client(XRPL_ENDPOINT);

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
