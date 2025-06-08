import { Router } from "express";
import { getNFTTokenIdFromTx } from "../components/xrplClient";

const router = Router();
router.get("/:txid", async (req, res): Promise<any> => {
  try {
    const { txid } = req.params;
    if (!txid) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }
    const tokenId = await getNFTTokenIdFromTx(txid);
    res.json({ tokenId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching NFT token ID for transaction ${req.params.txid}:`, errorMessage);
    res.status(500).json({ error: `Failed to get NFT token ID: ${errorMessage}` });
  }
});

export default router;