import { Router } from "express";
import { uploadJsonToIpfs } from "@repo/utils/ipfs";

const router = Router();

router.post("/", async (req, res) => {
  const { jsonData } = req.body;
  if (!jsonData) {
    res.status(400).json({ error: "jsonData is required" });
    return;
  }

  try {
    const pinataJwt = process.env.PINATA_JWT as string;
    const cid = await uploadJsonToIpfs(jsonData, pinataJwt);
    res.json({ cid });
  } catch (error) {
    console.error("Error uploading JSON:", error);
    res.status(500).json({ error: "Failed to upload JSON to IPFS." });
  }
});

export default router;
