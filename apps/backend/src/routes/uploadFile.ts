import { Router } from "express";
import multer from "multer";
import { uploadToIpfs } from "@repo/utils/ipfs";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "File is required" })
      return;
    }

    // Convert Express.Multer.File to a browser-like File using a polyfill
    // @ts-ignore
    const browserFile = new File([file.buffer], file.originalname, { type: file.mimetype });

    const pinataJwt = process.env.PINATA_JWT as string;
    const ipfsUrl = await uploadToIpfs(browserFile, pinataJwt);
    res.json({ ipfsUrl });
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    res.status(500).json({ error: "Failed to upload file to IPFS" });
  }
});

export default router;