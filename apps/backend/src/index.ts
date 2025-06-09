import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import accountRoute from "./routes/account";
import balanceRoute from "./routes/balance";
import nftsRoute from "./routes/nftList";
import uploadFileRoute from "./routes/uploadFile";
import uploadJsonRoute from "./routes/uploadJson";
import getNftTokenId from "./routes/getNftTokenId";
import getUrlFromCid from "./routes/getUrlFromCid";
import createAvatarRoute from "./routes/createAvatar";
import getPayloadStatusRoute from "./routes/createAvatar";


dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount routes

// XRPL  
app.use("/api/xrpl/account", accountRoute);
app.use("/api/xrpl/balance", balanceRoute);
app.use("/api/xrpl/nfts", nftsRoute);
app.use("/api/xrpl/getnftokenid", getNftTokenId);

// IPFS
app.use("/api/ipfs/uploadfile", uploadFileRoute);
app.use("/api/ipfs/uploadjson", uploadJsonRoute);
app.use("/api/ipfs/geturlfromcid", getUrlFromCid);

// AVATAR
app.use("/api/avatar/createavatar", createAvatarRoute);
app.use("/api/avatar/getpayloadstatus", getPayloadStatusRoute);

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
