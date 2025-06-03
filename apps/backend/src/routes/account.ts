import { Router } from "express";
import { getAccountInfo } from "../components/xrplClient";

const router = Router();

router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const response = await getAccountInfo(address);
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error fetching account info for ${req.params.address}:`,
      errorMessage,
    );
    res
      .status(500)
      .json({ error: `Failed to get account info: ${errorMessage}` });
  }
});

export default router;
