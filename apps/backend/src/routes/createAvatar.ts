import { Router } from "express";
import multer from "multer";
import { uploadToIpfs, uploadJsonToIpfs } from "@repo/utils/ipfs";
import { xummSdk } from "../components/xrplClient"; // Xumm SDKインスタンス
import { convertStringToHex } from "xrpl";

const router = Router();
const upload = multer();

router.post("/", upload.single("avatarImage"), async (req, res): Promise<void> => {
  try {
    const { userName, account, avatarType } = req.body;
    const file = req.file;

    if (!file || !userName || !account || !avatarType) {
      res.status(400).json({ error: "Missing required parameters." });
      return;
    }

    console.log("mint-avatar request received:", {
      userName,
      account,
      avatarType,
      fileName: file.originalname,
    });
    const pinataJwt = process.env.PINATA_JWT as string;

    // Upload avatar image to IPFS
    const browserFile = new File([file.buffer], file.originalname, { type: file.mimetype });
    const imageIpfsUrl = await uploadToIpfs(browserFile, pinataJwt);
    console.log("Image uploaded to IPFS:", imageIpfsUrl);

    // Create metadata
    const metadata = {
      name: `${userName}`,
      description: `An NFT representing ${userName} with Avatar ${avatarType}.`,
      image: imageIpfsUrl,
      Type: "Avatar",
    };

    // Upload metadata to IPFS
    const metadataCid = await uploadJsonToIpfs(metadata, pinataJwt);
    const metadataIpfsUrl = `ipfs://${metadataCid}`;
    console.log("Metadata uploaded to IPFS:", metadataIpfsUrl);

    // NFTokenMint
    const payloadResponse = await xummSdk.payload.create({
      txjson: {
        TransactionType: "NFTokenMint",
        Account: account,
        NFTokenTaxon: 0,
        URI: convertStringToHex(metadataIpfsUrl),
        Flags: 16,
      },
    });

    if (!payloadResponse) {
      console.error("Failed to create Xumm payload (null response).");
      res.status(500).json({ error: "Failed to create Xumm payload." });
      return;
    }

    const payloadUuid = payloadResponse.uuid;
    const qrPng = payloadResponse.refs?.qr_png || null;

    console.log("Xumm payload created:", {
      payloadUuid,
      qrPng,
    });

    res.json({
      payloadUuid,
      qrPng,
      metadataIpfsUrl,
    });

  } catch (error) {
    console.error("Error in mint-avatar:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:uuid", async (req, res) => {
    try {
        const { uuid } = req.params;
        const status = await xummSdk.payload.get(uuid);
        res.json(status);
    } catch (error) {
        console.error("Error fetching payload status:", error);
        res.status(500).json({ error: "Failed to fetch payload status." });
    }
});

export default router;
