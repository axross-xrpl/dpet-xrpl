import * as xrpl from "xrpl";
import { useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";

export function DpetPage() {
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [nftListText, setNftListText] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL!;
  // .envで定義したかったが読み込めず、暫定で直接保存
  const TEST_USER_ADDRESS = "rfiib1TjGx96EJPGvYRyc62jWZphox2An7";
  const TEST_USER_SECRET = "sEdTEkqWLJ5J74WPT4d6TFXmEdNvhjk";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
    setError(null);
    setIpfsUrl(null);
  };

  // 画像をアップロード
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    // ファイルをIPFSへアップロードする
    const response = await fetch(`${API_URL}/api/ipfs/uploadfile`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to backend");
    }

    const data = await response.json();
    return data.ipfsUrl;
  };

  // JSONをアップロード
  const uploadJson = async (jsonData: Object) => {
    // ファイルをIPFSへアップロードする
    const response = await fetch(`${API_URL}/api/ipfs/uploadjson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jsonData }),
    });

    if (!response.ok) {
      throw new Error("Failed to upload jsonData to backend");
    }

    const data = await response.json();
    return data.cid;
  };

  // NFTミント
  const createNft = async (jsonCid: string) => {
    // TODO ログインユーザーのアドレスを指定する
    const userAddress: string = TEST_USER_ADDRESS;
    console.log("userAddress", userAddress);

    const request = {
      address: userAddress,
      jsonUrl: `ipfs://${jsonCid}`,
    };

    const response = await fetch(`${API_URL}/api/pet/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to create NFT to backend");
    }

    const data = await response.json();
    return data.offerId;
  };

  // 売却オファーを受領
  const acceptSellOffer = async (offerId: string) => {
    // TODO ログインユーザーのsecretを指定する
    const userSecret: string = TEST_USER_SECRET;

    const request = {
      secret: userSecret,
      offerId,
    };

    const response = await fetch(`${API_URL}/api/pet/acceptSellOffer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to accept sell offer to backend");
    }

    return;
  };

  // アップロードボタンをクリック
  const handleUploadClick = async () => {
    if (!selectedFile) {
      setError("No file selected for upload.");
      setIpfsUrl(null);
      return;
    }

    setError(null);
    setIpfsUrl(null);
    setUploading(true);
    setOfferId(null);

    try {
      // 画像をアップロード
      const imageCid = await uploadImage(selectedFile);
      const imageUrl = `ipfs://${imageCid}`;
      setIpfsUrl(imageUrl);

      // JSONデータを作成
      // TODO pet_name, pet_typeを画面から取得
      const jsonData = {
        pet_name: "petName",
        image: imageUrl,
        date: new Date(),
        type: "pet",
        pet_type: "petType",
        generations: "gen1",
      };
      // JSONデータをアップロード
      const jsonCid = await uploadJson(jsonData);

      // NFTミントを実行し、オファーIDを取得
      const offerId = await createNft(jsonCid);
      setOfferId(offerId);

      // 売却オファーを受領
      await acceptSellOffer(offerId);
    } catch (err: any) {
      setError(err.message || "Error uploading file to IPFS.");
    } finally {
      setUploading(false);
    }
  };

  // NFTリストを取得
  const getNftList = async () => {
    // TODO ログインユーザーのアドレスを指定する
    const userAddress: string = TEST_USER_ADDRESS;

    const response = await fetch(`${API_URL}/api/xrpl/nfts/${userAddress}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to get NFT list to backend");
    }
    const responseJson = await response.json();
    return responseJson.result.account_nfts;
  };

  // NFTのペイロードを取得
  const getNftPayload = async (cid: string) => {
    const responseUrl = await fetch(
      `${API_URL}/api/ipfs/geturlfromcid/${cid}`,
      {
        method: "GET",
      }
    );

    if (!responseUrl.ok) {
      throw new Error("Failed to get URL from CID to backend");
    }

    const json = await responseUrl.json();
    const url = json.url;
    const responsePayload = await fetch(url);
    if (!responsePayload.ok) {
      throw new Error("Failed to get payload");
    }

    return await responsePayload.json();
  };

  // リスト取得ボタンをクリック
  const handleGetListClick = async () => {
    setNftListText(null);

    // NFTリストを取得
    // TODO NFTokenIDリストを渡して、ペイロード情報で返すようなAPIに修正する
    // TODO ログイン時にNFTリストを取得し、avatar/petそれぞれのNFTokenIDリストとして内部に保持
    const accountNftList = await getNftList();

    // ペイロードリスト
    const nftList: object[] = [];
    accountNftList.forEach(async (accountNft: any) => {
      const uriHex = accountNft.URI;
      if (uriHex === undefined) {
        return;
      }

      // URIからペイロードを取得
      // TODO xrplの処理はバックエンドにまとめたい。抽出まで一括で行うAPIを作るべきか？
      const uri = xrpl.convertHexToString(uriHex);
      const cid = uri.replace("ipfs://", "");
      const payload = await getNftPayload(cid);

      if (payload.type !== "pet") {
        return;
      }

      nftList.push({
        NFTokenID: accountNft.NFTokenID,
        payload,
      });
    });

    console.log("nftList: ", nftList);
    setNftListText("NFTリスト取得完了。コンソールログ見て");
  };

  return (
    <div>
      {/* TODO ペット画像を表示する */}
      <h2>DPet Page (IPFS Upload via Backend)</h2>
      <Input type="file" onChange={handleFileChange} disabled={uploading} />
      <Button
        onClick={handleUploadClick}
        disabled={uploading || !selectedFile}
        className="px-4 py-2 bg-yellow-700 text-white rounded font-semibold hover:bg-yellow-600 transition-colors duration-200 shadow"
      >
        {uploading ? "Uploading..." : "Upload"}
      </Button>
      {ipfsUrl && (
        <div>
          <p>File uploaded to IPFS:</p>
          <a
            href={
              ipfsUrl.startsWith("ipfs://")
                ? ipfsUrl.replace(
                    "ipfs://",
                    "https://gateway.pinata.cloud/ipfs/"
                  )
                : ipfsUrl
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {ipfsUrl}
          </a>
        </div>
      )}
      {offerId && <div>offerId: {offerId}</div>}

      {/* NFT一覧取得 */}
      <Button
        onClick={handleGetListClick}
        className="px-4 py-2 bg-yellow-700 text-white rounded font-semibold hover:bg-yellow-600 transition-colors duration-200 shadow"
      >
        NFT一覧を取得
      </Button>
      {nftListText && (
        <div>
          <p>NFT List</p>
          <div>{nftListText}</div>
        </div>
      )}

      {error && <div style={{ color: "yellow" }}>{error}</div>}
    </div>
  );
}
