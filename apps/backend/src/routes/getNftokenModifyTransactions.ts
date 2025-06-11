import { Router } from "express";
import { getNFTokenModifyTransactions } from "../components/xrplClient";

const router = Router();
router.get("/:account", async (req, res) => {
  try {
    const { account } = req.params;

    if (!account || typeof account !== "string") {
      res.status(400).json({ error: "account is required and must be a string" });
      return;
    }

    const transactions = await getNFTokenModifyTransactions(account);
    res.json(transactions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to get NFToken modify transactions: ${errorMessage}` });
  }
});

export default router;