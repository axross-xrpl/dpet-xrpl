import { Router } from "express";
import multer from "multer";

import { createNft } from "../components/xrplClient";

const router = Router();
const upload = multer();

router.post("/", async (req, res) => {
  try {
    const address = req.body.address;
    const jsonUrl = req.body.jsonUrl;
    if (!address) {
      res.status(400).json({ error: "address is required" });
      return;
    }
    if (!jsonUrl) {
      res.status(400).json({ error: "jsonUrl is required" });
      return;
    }

    // NFTミントを実行
    const response = await createNft(address, jsonUrl);

    const meta = response.result.meta;
    if (meta.TransactionResult !== "tesSUCCESS") {
      throw new Error("Failed to get offerId");
    }

    // オファーIDを返す
    res.json({ offerId: meta.offer_id });
  } catch (error) {
    console.error("Error creating pet NFT:", error);
    res.status(500).json({ error: "Failed to create pet NFT" });
  }
});

export default router;
