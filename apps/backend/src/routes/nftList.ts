import { Router } from "express";
import { getAccountNFTs } from "../components/xrplClient";

const router = Router();

router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const response = await getAccountNFTs(address);
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error fetching NFT list for ${req.params.address}:`,
      errorMessage,
    );
    res
      .status(500)
      .json({ error: `Failed to get NFT list: ${errorMessage}` });
  }
});

export default router;
