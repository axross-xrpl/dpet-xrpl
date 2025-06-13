import { useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import { useXumm } from "@repo/frontend/contexts/XummContext";

export function DpetPage() {
  const { xumm, nftList } = useXumm();
  const account = xumm.state.account;

  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [nftListText, setNftListText] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL!;
  // TODO 画面入力で取得できるようにする
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
    const request = {
      address: account,
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
    // TODO 画面入力からsecretを取得する
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

  // NFTリストを読み込む
  const loadNftList = async (list: object[]) => {
    const response = await fetch(`${API_URL}/api/xrpl/nfts/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nftList: list }),
    });

    if (!response.ok) {
      throw new Error("Failed to lost NFT list to backend");
    }
    const responseJson = await response.json();
    return responseJson;
  };

  // リスト取得ボタンをクリック
  const handleGetListClick = async () => {
    setNftListText(null);

    // ペットNFTリストのペイロード読み込む
    if (nftList && "pets" in nftList && Array.isArray(nftList.pets)) {
      const petList = await loadNftList(nftList.pets);
      setNftListText(JSON.stringify(petList));
    } else {
      setError("No pet list available.");
    }
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
