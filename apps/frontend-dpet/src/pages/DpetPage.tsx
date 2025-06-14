import * as xrpl from "xrpl";
import { useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import { createNFTokenModifyPayload } from "@repo/utils/nftokenModify";
import { useXumm } from "@repo/frontend/contexts/XummContext";

export function DpetPage() {
  const { xumm, nftList, fetchNftList } = useXumm();
  const account = xumm.state.account;

  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [petName, setPetName] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [petNftList, setPetNftList] = useState<object[] | null>(null);
  const [petNftListText, setPetNftListText] = useState<string | null>(null);
  const [nftModifyText, setNftModifyText] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  // 現在日時を取得し、フォーマット'YYYY-MM-DD:hh:mm:ss'で返す
  const getNowDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 月は0から始まるため+1
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    // const formattedDate = now.toISOString().replace('T', ':').substring(0, 19);

    // dateフォーマット 'YYYY-MM-DD:HH:MM:SS'
    return `${year}-${month}-${day}:${hours}:${minutes}:${seconds}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
    setError(null);
    setIpfsUrl(null);
  };
  const handlePetNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPetName(event.target.value);
    setError(null);
    setIpfsUrl(null);
  };
  const handleSecretChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(event.target.value);
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
    if (!secret) {
      return;
    }

    const request = {
      secret,
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
      // TODO pet_typeを画面から取得
      const jsonData = {
        pet_name: petName,
        image: imageUrl,
        date: getNowDate(),
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
    setPetNftList(null);
    setPetNftListText(null);

    // ペットNFTリストのペイロード読み込む
    if (nftList && "pets" in nftList && Array.isArray(nftList.pets)) {
      const petNftList = await loadNftList(nftList.pets);
      setPetNftList(petNftList);
      setPetNftListText(JSON.stringify(petNftList));
    } else {
      setError("No pet list available.");
    }
  };

  const handleModifyNftClick = async () => {
    setNftModifyText(null);

    // petNftListの1件目を更新する
    // 日付を更新してmodify
    if (petNftList == null) {
      setNftModifyText("petNftListがありません。");
      return;
    }
    const petNftData: any = petNftList[0];
    const nftokenId: string = petNftData.NFTokenID;
    const payload: object = petNftData.payload;
    // [DEBUG]日付を更新
    // TODO ペット更新イベントで実施
    const newPayload = {
      ...payload,
      date: getNowDate(),
    };

    try {
      // JSONデータをアップロード
      const jsonCid = await uploadJson(newPayload);

      // NFT更新
      const data: any = createNFTokenModifyPayload({
        Account: account,
        NFTokenID: nftokenId,
        URI: xrpl.convertStringToHex(`ipfs://${jsonCid}`),
      });
      const res = await xumm.payload?.create(data);
      setNftModifyText(`modifyNft response: ${JSON.stringify(res)}`);

      // NFTリストを更新
      // TODO 更新した内容が反映されていない
      await fetchNftList(account);
    } catch (err: any) {
      setError(err.message || "Error uploading file to IPFS.");
    }
  };

  return (
    <div>
      {/* TODO ペット画像を表示する */}
      <h2>DPet Page (IPFS Upload via Backend)</h2>
      <div className="p-2">
        <span>File: </span>
        <Input type="file" onChange={handleFileChange} disabled={uploading} />
      </div>
      <div className="p-2">
        <span>pet name: </span>
        <Input
          name="petName"
          onChange={handlePetNameChange}
          disabled={uploading}
        />
      </div>
      <div className="p-2">
        <span>secret: </span>
        <Input
          name="secret"
          onChange={handleSecretChange}
          disabled={uploading}
        />
      </div>
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
      {petNftListText && (
        <div>
          <p>Pet NFT List</p>
          <div>{petNftListText}</div>
        </div>
      )}

      {/* NFT更新 */}
      <Button
        onClick={handleModifyNftClick}
        className="px-4 py-2 bg-yellow-700 text-white rounded font-semibold hover:bg-yellow-600 transition-colors duration-200 shadow"
      >
        NFT更新
      </Button>
      {nftModifyText && <div>{nftModifyText}</div>}

      {error && <div style={{ color: "yellow" }}>{error}</div>}
    </div>
  );
}
