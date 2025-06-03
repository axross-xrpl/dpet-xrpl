import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import accountRoute from "./routes/account";
import balanceRoute from "./routes/balance";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/account", accountRoute);
app.use("/api/balance", balanceRoute);

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
