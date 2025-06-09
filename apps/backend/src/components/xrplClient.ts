import * as xrpl from "xrpl";
import dotenv from "dotenv";
dotenv.config();

const XRPL_ENDPOINT = process.env.XRPL_ENDPOINT!;
if (!XRPL_ENDPOINT) {
  throw new Error("XRPL_ENDPOINT is not defined in the environment variables.");
}

// Helper to create a new client per request
function createClient() {
  return new xrpl.Client(XRPL_ENDPOINT);
}

// Retrieves account information from the XRPL network
export async function getAccountInfo(address: string) {
  const client = createClient();
  await client.connect();
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
    await client.disconnect();
  }
}

// Retrieves the balance of an account from the XRPL network
export async function getAccountBalance(address: string) {
  const client = createClient();
  await client.connect();
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
    await client.disconnect();
  }
}

// Retrieves NFTs owned by an account from the XRPL network
export async function getAccountNFTs(address: string) {
  const client = createClient();
  await client.connect();
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
    await client.disconnect();
  }
}

// Retrieves the token ID of NFT from a transaction on the XRPL network
export async function getNFTTokenIdFromTx(
  txid: string
): Promise<string | null> {
  const client = createClient();
  await client.connect();
  try {
    const response = await client.request({
      command: "tx",
      transaction: txid,
      binary: false,
      api_version: 2,
    });
    if (!response.result || !response.result.meta) {
      throw new Error(`Transaction ${txid} not found or has no metadata.`);
    }

    const txType = response.result.tx_json?.TransactionType;
    if (txType === "NFTokenMint") {
      const meta = response.result.meta;
      // Check if meta is an object and has nftoken_id property
      const nftTokenId =
        typeof meta === "object" && meta !== null && "nftoken_id" in meta
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
    await client.disconnect();
  }
}

// ペットNFTをミント
export async function createPetNft(
  address: string,
  jsonCid: string
): Promise<any> {
  const client = createClient();
  await client.connect();
  try {
    // system account
    const wallet = xrpl.Wallet.fromSecret(process.env.SYSTEM_SECRET as string);

    const response = await client.submitAndWait(
      {
        TransactionType: "NFTokenMint",
        Account: wallet.address,
        NFTokenTaxon: 0,
        URI: xrpl.convertStringToHex(`ipfs://${jsonCid}`),
        // TODO 販売金額を設定
        Amount: xrpl.xrpToDrops("10"),
        Destination: address,
      },
      {
        wallet,
      }
    );
    console.log("NFTokenMint:", response);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create Pet NFT: ${errorMessage}`);
  } finally {
    await client.disconnect();
  }
}

// 売却オファーを承認
export async function acceptSellOffer(
  secret: string,
  offerId: string
): Promise<any> {
  const client = createClient();
  await client.connect();

  try {
    const wallet = xrpl.Wallet.fromSecret(secret);

    // 売却オファーの承認
    const responseAcceptOffer = await client.submitAndWait(
      {
        TransactionType: "NFTokenAcceptOffer",
        Account: wallet.address,
        NFTokenSellOffer: offerId,
      },
      {
        wallet,
      }
    );
    console.log("NFTokenAcceptOffer:", responseAcceptOffer);
    return responseAcceptOffer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to accept sell offer: ${errorMessage}`);
  } finally {
    await client.disconnect();
  }
}
