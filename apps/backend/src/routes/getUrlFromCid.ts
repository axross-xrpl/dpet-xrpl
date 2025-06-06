import { Router } from "express";
import { getUrl } from "@repo/utils/ipfs";

const router = Router();

router.get("/:cid", async (req, res): Promise<any> => {
  const { cid } = req.params;

  if (!cid) {
    return res.status(400).json({ error: "CID is required" });
  }

  try {
    const pinataJwt = process.env.PINATA_JWT as string;
    const url =await getUrl(cid, pinataJwt);
    res.json({ url });
  } catch (error) {
    console.error("Error getting URL from CID:", error);
    res.status(500).json({ error: "Failed to get URL from CID" });
  }
});

export default router;