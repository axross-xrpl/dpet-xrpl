import { Router } from "express";
import { getAccountBalance } from "../components/xrplClient";

const router = Router();

router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const response = await getAccountBalance(address);
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error fetching balance for ${req.params.address}:`,
      errorMessage,
    );
    res
      .status(500)
      .json({ error: `Failed to get account balance: ${errorMessage}` });
  }
});

export default router;
