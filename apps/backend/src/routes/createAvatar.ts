import { Router } from "express";
import multer from "multer";
import { uploadToIpfs, uploadJsonToIpfs } from "@repo/utils/ipfs";
import { getNFTTokenIdFromTx  } from "../components/xrplClient";

const router = Router();
const upload = multer();

// 環境変数からPinata JWTの取得(Pinata APIへの認証に使用)
const pinataJwt = process.env.PINATA_JWT as string;

/**
 * アバター画像をIPFSにアップロード
 * @description ユーザーが選択したアバター画像をIPFSに保存するためのバックエンドロジック
 * @returns {string} ipfsUrl
 */
router.post("/upload-file", upload.single("avatarImage"), async (req, res) => {
  try {
    // req.fileオブジェクトからアバター画像のファイル情報を取得
    const avatarImage = req.file;
    // ファイル存在チェック
    if (!avatarImage) {
      // HTTPステータスコード400 (Bad Request) とエラーメッセージを返し処理を終了
      res.status(400).json({ error: "File is required" });
      return;
    }

    // Fileオブジェクトの作成
    // avatarImage.buffer: アップロードされた画像のバイナリデータ
    // avatarImage.originalname: アップロードされたファイルの元の名前
    // avatarImage.mimetype: アップロードされたファイルのMIMEタイプ（例: image/jpeg）
    const browserFile = new File([avatarImage.buffer], avatarImage.originalname, { type: avatarImage.mimetype });
    
    // アバター画像をPinata経由でIPFSにアップロード
    const ipfsUrl = await uploadToIpfs(browserFile, pinataJwt);
    // アバター画像がIPFS上でアクセスできるURLをJSON形式でクライアントに返す
    res.json({ ipfsUrl });

  } catch (error) {
    // HTTPステータスコード500 (Internal Server Error) とエラーメッセージを返す
    console.error("Error uploading avatar image file to IPFS:", error);
    res.status(500).json({ error: "Failed to uploading avatar image file to IPFS." });
  }
});

/**
 * NFTのメタデータなどのJSONをIPFSにアップロード
 * @description NFTのメタデータなどの任意のJSONデータをIPFSに保存するためのバックエンドロジック
 * @returns {string} cid
 */
router.post("/upload-json", async (req, res) => {
  // req.bodyオブジェクトからJSONデータ(metadata)を取得
  const jsonData = req.body;

  try {
    // JSONデータをPinata経由でIPFSにアップロード
    const cid = await uploadJsonToIpfs(jsonData, pinataJwt);

    // JSONデータがIPFS上で一意に識別されるcidをJSON形式でクライアントに返す
    // CIDはIPFSからJSONデータを取得したり、NFTのURIとして使用したりできる
    res.json({ cid });
  } catch (error) {
    // HTTPステータスコード500 (Internal Server Error) とエラーメッセージを返す
    console.error("Error uploading JSON:", error);
    res.status(500).json({ error: "Failed to uploading JSON to IPFS." });
  }
});

/**
 * トランザクションID (txid) から実際にミントされたNFTのトークンIDを取得する
 * @description XRPL上でNFTがミントされたトランザクションの情報を解析し、そのトランザクションによって発行されたNFTのトークンIDを特定する
 * @returns {string} tokenId
 */
router.get("/:txid", async (req, res): Promise<any> => {
  try {
    // URLパスからtxidパラメータを取得
    const { txid } = req.params;
    // txid存在チェック
    if (!txid) {
      // HTTPステータスコード400 (Bad Request) とエラーメッセージを返して処理を終了
      res.status(400).json({ error: "Transaction ID is required" });
      return;
    }

    // NFTトークンIDの取得
    const tokenId = await getNFTTokenIdFromTx(txid);
    // tokenIdをJSON形式でクライアントに返す
    // トークンIDは、NFTの識別子として使用され、NFTの詳細ページへのリンクを生成する際などに利用
    res.json({ tokenId });
  } catch (error) {
    // HTTPステータスコード500 (Internal Server Error) と、エラーメッセージを返す
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching NFT token ID for transaction ${req.params.txid}:`, errorMessage);
    res.status(500).json({ error: `Failed to get NFT token ID: ${errorMessage}` });
  }
});

export default router;
