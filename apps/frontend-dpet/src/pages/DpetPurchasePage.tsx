import { useState } from "react";
import { Button } from "@repo/ui/button";
import { useXumm } from "@repo/frontend/contexts/XummContext";
import { LoadingOverlay } from "@repo/ui/loadingOverlay";


export function DpetPurchasePage() {
  const { xumm } = useXumm();
  const account = xumm.state.account;

  const [error, setError] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const API_URL = import.meta.env.VITE_BACKEND_URL!;


  // 画像をアップロード
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

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
  const acceptSellOffer = async (offerId: string, secret: string) => {

    const request = {
      secret: secret,
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



  const handleMintNft = async (petName: string, petType: string, secret: string) => {

    setError(null);
    setOfferId(null);

    try {

      // TODO: 選ばれたペットごとに内容を変更する
      const image = "/src/assets/pets/dog001.jpg"; 
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Failed to fetch local image: ${response.statusText}`);
      }
      const imageBlob = await response.blob();
      const file = new File([imageBlob], "dog001.jpg", { type: imageBlob.type });

      // 画像をアップロード
      const imageCid = await uploadImage(file);
      const imageUrl = `ipfs://${imageCid}`;

      // JSONデータを作成
      const jsonData = {
        pet_name: petName,
        image: imageUrl,
        date: new Date(),
        type: "pet",
        pet_type: petType,
        generations: "gen1",
      };
      // JSONデータをアップロード
      const jsonCid = await uploadJson(jsonData);
      console.log(jsonCid);

      // NFTミントを実行し、オファーIDを取得
      const offerId = await createNft(jsonCid);
      console.log(offerId);
      setOfferId(offerId);

      // 売却オファーを受領
      await acceptSellOffer(offerId, secret);
    } catch (err: any) {
      setError(err.message || "Error uploading file to IPFS.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>

      {/* ▼ Loading */}
      {isLoading && (
        <LoadingOverlay message="Loading ..." />
      )}

      <section>
        <div className="w-full p-10">
          <h1 className="items-center justify-center p-4 text-xl font-bold text-center">Dynamic NFT Pets!</h1>
          <div className="max-w-5xl mx-auto p-4">
            <div className="text-xl font-bold text-left">Get Your dPet!</div>
            <br/>
            <div className="text-xl text-left">
              Make healthy living more fun!
              In our healthcare app, a Dynamic NFT digital pet will support your health management.
              When you log your meals together, your pet grows! Your healthy actions lead to your pet's growth.
              Spend time with your adorable pet and build healthy habits. Why not start a new day with your pet?
            </div>
          </div>
        </div>
      </section>

      <section>

        <div className="w-full m-10">
          <div className="bg-yellow-100 p-8 rounded-xl shadow-lg w-full max-w-5xl mx-auto h-full flex flex-col items-center gap-8">
            <div className="flex w-full gap-8 items-center justify-center">

              {/* Pet 1 */}
              <div className="flex flex-col items-center">
                <img
                  src="/src/assets/pets/bird001.jpg"
                  alt="Pet type 1"
                  className="w-48 h-48 object-contain"
                />

                <div className="flex flex-col font-bold items-center p-6">
                  10 XRP
                </div>

                <div className="flex flex-col items-center">
                  <Button
                    className="self-center px-8 py-2 bg-gray-400 text-black text-lg font-semibold rounded-full shadow-lg0"
                    // onClick={() => setShowPopup(true)}
                    disabled
                  >
                    Mint NFT
                  </Button>
                </div>
              </div>

              {/* Pet 2 */}
              <div className="flex flex-col items-center">
                <img
                  src="/src/assets/pets/dog001.jpg"
                  alt="Pet type 1"
                  className="w-48 h-48 object-contain"
                />

                <div className="flex flex-col font-bold items-center p-6">
                  10 XRP
                </div>

                <div className="flex flex-col items-center">
                  <Button
                    className="self-center px-8 py-2 bg-yellow-400 text-black text-lg font-semibold rounded-full shadow-lg hover:bg-yellow-500 transition duration-200"
                    onClick={() => setShowPopup(true)}
                  >
                    Mint NFT
                  </Button>
                </div>
              </div>

              {/* Pet 3 */}
              <div className="flex flex-col items-center">
                <img
                  src="/src/assets/pets/monkey001.jpg"
                  alt="Pet type 1"
                  className="w-48 h-48 object-contain"
                />

                <div className="flex flex-col font-bold items-center p-6">
                  10 XRP
                </div>

                <div className="flex flex-col items-center">
                  <Button
                    className="self-center px-8 py-2 bg-gray-400 text-black text-lg font-semibold rounded-full shadow-lg0"
                    // onClick={() => setShowPopup(true)}
                    disabled={true}
                  >
                    Mint NFT
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
            

      {/* for debug */}
      {offerId && <div>offerId: {offerId}</div>}

      </section>

      {error && <div style={{ color: "yellow" }}>{error}</div>}

      {/* ▼ Mintポップアップ */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
          <div className="bg-yellow-100 p-6 rounded-xl shadow-lg w-96 flex flex-col gap-4">
            {/* Name */}
            <label className="font-bold text-gray-800">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full p-2 border border-gray-300 rounded"
              />
            </label>

            {/* 区切り線 */}
            <hr className="border-t border-yellow-400" />

            {/* Name */}
            <label className="font-bold text-gray-800">
              Secret
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Your Secret"
                className="mt-1 w-full p-2 border border-gray-300 rounded"
              />
            </label>
            <div className="text-red-500 text-lg text-center py-3">
              ※プロトタイプのためXRPLのシークレット入力が必要です
            </div>

            {/* 区切り線 */}
            <hr className="border-t border-yellow-400" />

            {/* Mintボタン */}
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold"
              onClick={() => {
                handleMintNft(name, "dog001", secret);
                setShowPopup(false);
                // ローディング表示開始
                setIsLoading(true);
              }}
            >
              Mint
            </Button>

            {/* Closeボタン */}
            <Button
              className="text-sm text-red-600 underline"
              onClick={() => setShowPopup(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
