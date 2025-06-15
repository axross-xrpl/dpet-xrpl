import * as xrpl from "xrpl";
import { Router } from "express";
import { getUrl } from "@repo/utils/ipfs";
import { getAccountNFTs } from "../components/xrplClient";

const router = Router();

router.get("/:address", async (req, res) => {
  // typeごとのNFTリストを取得
  const getNftListEachType = async (nfts: any[]) => {
    const pinataJwt = process.env.PINATA_JWT as string;

    const avatars: object[] = [];
    const pets: object[] = [];

    for (const nft of nfts) {

      const { NFTokenID, URI } = nft;
      if (URI === undefined) {
        return;
      }

      // URIからペイロードを取得
      const uri = xrpl.convertHexToString(URI);
      const cid = uri.replace("ipfs://", "");
      const url = await getUrl(cid, pinataJwt);

      // const url = "https://ipfs.io/ipfs/" + cid;

      console.log("url")
      console.log(url)

      const response = await fetch(url);
      const payload = await response.json();

      const nftData = {
        NFTokenID,
        URI,
      };

      if (payload.type === "avatar") {
        avatars.push(nftData);
      } else if (payload.type === "pet") {
        pets.push(nftData);
      }
    }

    return { avatars, pets };
  };

  try {
    const { address } = req.params;
    // NFTリストを取得
    const response = await getAccountNFTs(address);
    const accountNfts = response.result.account_nfts;

    // アバター、ペットそれぞれのNFTリストを取得
    const nftList = await getNftListEachType(accountNfts);
    const avatars = nftList?.avatars;
    const pets = nftList?.pets;
    res.json({ address, avatars, pets });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error fetching NFT list for ${req.params.address}:`,
      errorMessage
    );
    res.status(500).json({ error: `Failed to get NFT list: ${errorMessage}` });
  }
});

// NFTリストを解析
router.post("/load", async (req, res) => {
  const pinataJwt = process.env.PINATA_JWT as string;
  const nftList = req.body.nftList;
  const list: object[] = [];

  try {
    for (const nft of nftList) {
      const { NFTokenID, URI } = nft;
      if (URI === undefined) {
        return;
      }

      // URIからペイロードを取得
      const uri = xrpl.convertHexToString(URI);
      const cid = uri.replace("ipfs://", "");
      const url = await getUrl(cid, pinataJwt);

      // const url = "https://ipfs.io/ipfs/" + cid;

      const response = await fetch(url);
      if (response.status !== 200) {
        throw new Error(`fetch error: status ${response.status}`);
      }
      const payload = await response.json();

      const nftData = {
        NFTokenID,
        payload,
      };
      list.push(nftData);
    }
    res.json(list);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error load NFT list:`, errorMessage);
    res.status(500).json({ error: `Failed to load NFT list: ${errorMessage}` });
  }
});

export default router;
