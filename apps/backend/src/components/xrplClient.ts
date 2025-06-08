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

// create Pet NFT
export async function createPetNft(jsonCid: string): Promise<any> {
  await connectClient();
  try {
    // system account
    const wallet = xrpl.Wallet.fromSecret(process.env.SYSTEM_SECRET as string);
    // user account
    const destAddress = process.env.USER_ADDRESS as string;

    const response = await client.submitAndWait(
      {
        TransactionType: "NFTokenMint",
        Account: wallet.address,
        NFTokenTaxon: 0,
        URI: xrpl.convertStringToHex(`ipfs://${jsonCid}`),
        // TODO 販売金額を設定
        Amount: xrpl.xrpToDrops("10"),
        Destination: destAddress,
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
    await disconnectClient();
  }
}

// create sell offer
export async function createSellOffer(nftokenId: string): Promise<any> {
  await connectClient();
  try {
    // system account
    const wallet = xrpl.Wallet.fromSecret(process.env.SYSTEM_SECRET as string);

    const response = await client.submitAndWait(
      {
        TransactionType: "NFTokenCreateOffer",
        Account: wallet.address,
        NFTokenID: nftokenId,
        Flags: 1, // 売却オファーを作成
        // TODO 販売金額を設定
        Amount: xrpl.xrpToDrops("10"),
      },
      {
        wallet,
      }
    );
    console.log("NFTokenCreateOffer:", response);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create sell offer: ${errorMessage}`);
  } finally {
    await disconnectClient();
  }
}

// accept sell offer
export async function acceptSellOffer(offerId: string): Promise<any> {
  await connectClient();
  try {
    // user account
    const wallet = xrpl.Wallet.fromSecret(process.env.USER_SECRET as string);

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
    await disconnectClient();
  }
}
