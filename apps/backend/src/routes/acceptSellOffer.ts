import { Router } from "express";
import multer from "multer";

import { acceptSellOffer } from "../components/xrplClient";

const router = Router();
const upload = multer();

router.post("/", async (req, res) => {
  try {
    const secret = req.body.secret;
    const offerId = req.body.offerId;
    if (!secret) {
      res.status(400).json({ error: "secret is required" });
      return;
    }
    if (!offerId) {
      res.status(400).json({ error: "offerId is required" });
      return;
    }

    // 売却オファーを受領する
    const responseAcceptOffer = await acceptSellOffer(secret, offerId);

    // TODO レスポンスデータを整理する
    res.json(responseAcceptOffer);
  } catch (error) {
    console.error("Error creating pet NFT:", error);
    res.status(500).json({ error: "Failed to create pet NFT" });
  }
});

export default router;
