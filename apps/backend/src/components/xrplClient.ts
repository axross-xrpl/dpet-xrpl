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

// NFTミントを実行し、売却オファーを作成
export async function createNft(
  address: string,
  jsonUrl: string
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
        URI: xrpl.convertStringToHex(jsonUrl),
        // TODO 販売金額を設定
        Amount: xrpl.xrpToDrops("10"),
        Destination: address,
        Flags:
          xrpl.NFTokenMintFlags.tfTransferable |
          xrpl.NFTokenMintFlags.tfMutable,
      },
      {
        wallet,
      }
    );
    console.log("NFTokenMint:", response);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create NFT: ${errorMessage}`);
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

// Retrieves NFTokenModify transactions
export async function getNFTokenModifyTransactions(address: string) {
  const client = createClient();
  await client.connect();
  try {
    let marker: any = undefined;
    let allTransactions: any[] = [];

    do {
      // Fetch transactions for the account with pagination
      const response = await client.request({
        command: "account_tx",
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        forward: true, 
        marker: marker,
      });

      allTransactions = allTransactions.concat(response.result.transactions);
      marker = response.result.marker;

    } while (marker);

    
    if (allTransactions.length === 0) {
      // No transactions found at all after attempting pagination
      throw new Error(`No transactions found for account: ${address}`);
    }

    // Store URI history for each token
    // Key: NFTokenID, Value: { mintUri?: string, modifyUrisChronological: string[] }
    const tokenUriData: Record<string, { mintUri?: string, modifyUrisChronological: string[] }> = {};

    for (const tx of allTransactions) {
      const transactionDetails = tx.tx_json;
      const meta = tx.meta; // Metadata from the transaction

      if (!transactionDetails || !meta) {
        continue; // Skip if essential parts are missing
      }

      if (transactionDetails.TransactionType === "NFTokenMint") {
        const nftokenId = typeof meta === 'object' && meta !== null && 'nftoken_id' in meta ? meta.nftoken_id as string : undefined;
        const uri = transactionDetails.URI ? xrpl.convertHexToString(transactionDetails.URI) : undefined;

        if (nftokenId && uri) {
          if (!tokenUriData[nftokenId]) {
            tokenUriData[nftokenId] = { modifyUrisChronological: [] };
          }
          // Set mintUri only once (the first one encountered, which is the actual mint)
          if (!tokenUriData[nftokenId].mintUri) {
            tokenUriData[nftokenId].mintUri = uri;
          }
        }
      } else if (transactionDetails.TransactionType === "NFTokenModify") {
        const nftokenId = transactionDetails.NFTokenID; // NFTokenID is directly in tx_json for modify
        const uri = transactionDetails.URI ? xrpl.convertHexToString(transactionDetails.URI) : undefined;

        if (nftokenId && uri) {
          if (!tokenUriData[nftokenId]) {
            // Initialize the tokenUriData entry if it doesn't exist
            tokenUriData[nftokenId] = { modifyUrisChronological: [] };
          }
          tokenUriData[nftokenId].modifyUrisChronological.push(uri);
        }
      }
    }
    // Format the transactions to include NFTokenID and URIs
    const formattedTransactions = Object.keys(tokenUriData).map(nftokenId => {
      const data = tokenUriData[nftokenId];
      const finalUris: string[] = [];

      if (data && data.mintUri) {
        finalUris.push(data.mintUri);
      }

      if (data && data.modifyUrisChronological) {
        data.modifyUrisChronological.forEach(modUri => {
          // Add modify URI if it's different from the last URI added to finalUris
          if (finalUris.length === 0 || finalUris[finalUris.length - 1] !== modUri) {
            finalUris.push(modUri);
          }
        });
      }
      
      return {
        NFTokenID: nftokenId,
        URIs: finalUris,
      };
    }).filter(item => item.URIs.length > 0); // Only include items that have at least one URI

    if (formattedTransactions.length === 0) {
        console.warn(`No NFTokenMint or NFTokenModify transactions with URIs found for account: ${address}`);
    }

    return formattedTransactions;
  
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get NFTokenModify transactions: ${errorMessage}`);
  } finally {
    await client.disconnect();
  }
}
