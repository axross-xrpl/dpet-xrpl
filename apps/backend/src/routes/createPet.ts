import { Router } from "express";
import multer from "multer";
import { uploadToIpfs, uploadJsonToIpfs } from "@repo/utils/ipfs";

import {
  createPetNft,
  createSellOffer,
  acceptSellOffer,
} from "../components/xrplClient";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const petName = req.body.petName;
    const petType = req.body.petType;
    const file = req.file;
    if (!petName) {
      res.status(400).json({ error: "petName is required" });
      return;
    }
    if (!petType) {
      res.status(400).json({ error: "petType is required" });
      return;
    }
    if (!file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const pinataJwt = process.env.PINATA_JWT as string;

    // ファイルを読み込んでアップロード
    const imageCid = await uploadImage(file, pinataJwt);
    console.log("imageCid:", imageCid);

    // JSONデータを作成してアップロード
    const jsonData = {
      pet_name: petName,
      image: `ipfs://${imageCid}`,
      date: new Date(),
      type: "pet",
      pet_type: petType,
    };
    const jsonCid = await uploadJsonToIpfs(jsonData, pinataJwt);
    console.log("jsonCid:", jsonCid);

    // JSONのCIDを埋め込んだペイロードを作成し、NFTミントを実行
    const responsePetNft = await createPetNft(jsonCid);
    // トークンIDを取得
    const nftokenId = getNFTokenId(responsePetNft);

    // システムアカウントで売却オファーを作成
    const responseSellOffer = await createSellOffer(nftokenId);
    // オファーIDを取得
    const offerId = getOfferId(responseSellOffer);

    // ユーザーアカウントで売却オファーを受領
    const responseAcceptOffer = await acceptSellOffer(offerId);

    // TODO レスポンス整理
    // res.json({ NFTokenID: nftokenId! });
    res.json(responseAcceptOffer);
  } catch (error) {
    console.error("Error creating pet NFT:", error);
    res.status(500).json({ error: "Failed to create pet NFT" });
  }
});

// upload image to IPFS
async function uploadImage(file: any, pinataJwt: string): Promise<string> {
  // Convert Express.Multer.File to a browser-like File using a polyfill
  // @ts-ignore
  const browserFile = new File([file.buffer], file.originalname, {
    type: file.mimetype,
  });

  const ipfsUrl = await uploadToIpfs(browserFile, pinataJwt);
  return ipfsUrl;
}

// get NFTokenId from NFTokenMint response
function getNFTokenId(response: any): string {
  const meta = response.result.meta;
  if (meta.TransactionResult !== "tesSUCCESS") {
    throw new Error("Failed to get NFTokenId");
  }

  return meta.nftoken_id;
}

// get offerId from NFTokenCreateOffer response
function getOfferId(response: any): string {
  const meta = response.result.meta;
  if (meta.TransactionResult !== "tesSUCCESS") {
    throw new Error("Failed to get offerId");
  }

  return meta.offer_id;
}

export default router;
