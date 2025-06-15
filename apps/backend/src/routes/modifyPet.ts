import { Router } from "express";
import multer from "multer";

import { modifyNft } from "../components/xrplClient";

const router = Router();
const upload = multer();

router.post("/", async (req, res) => {
  try {
    const address =  req.body.address;
    const tokenid = req.body.tokenid;
    const jsonUrl = req.body.jsonUrl;
    if (!address) {
      res.status(400).json({ error: "address is required" });
      return;
    }
    if (!tokenid) {
      res.status(400).json({ error: "tokenid is required" });
      return;
    }
    if (!jsonUrl) {
      res.status(400).json({ error: "jsonUrl is required" });
      return;
    }

    // NFT更新を実行
    const response = await modifyNft(tokenid, address, jsonUrl);

    const meta = response.result.meta;
    if (meta.TransactionResult !== "tesSUCCESS") {
      throw new Error("Failed to get offerId");
    }

    // token IDを返す
    res.json({ tokenid: meta.tokenid });
  } catch (error) {
    console.error("Error updating pet NFT:", error);
    res.status(500).json({ error: "Failed to create pet NFT" });
  }
});

export default router;
