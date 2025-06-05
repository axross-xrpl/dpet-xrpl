import { useXumm } from "../contexts/XummContext";
import { Button } from "@repo/ui/button";
import { useState } from "react";

export function HomePage() {
  const { xumm } = useXumm();
  const account = xumm.state.account;
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; avatar: 'A' | 'B'; tokenId: string; } | null >(null);
  const [name, setName] = useState('');
  const [avatarType, setAvatarType] = useState<'A' | 'B'>('A');

  const handleMintNft = async (userName: string, avatar: 'A' | 'B') => {
    try {
      if (!xumm.payload) throw new Error("Xumm payload is not available.");
      if (!account) throw new Error("Account is not available.");

      console.log("Minting for:", userName, avatar);
    
      setMintStatus(null);
      setShowQr(true);
      setShowPopup(true);

      const response = await xumm.payload.create({
        txjson: {
          TransactionType: "NFTokenMint",
          Account: account,
          NFTokenTaxon: 0,
          Flags: 16,
        },
      });

      if (!response) {
        setMintStatus("Failed to create payload.");
        setShowQr(false);
        return;
      }

      setQrUrl(response.refs?.qr_png || null);

      // Poll for status
      const poll = setInterval(async () => {
        if (!xumm.payload) {
          setMintStatus("Xumm payload is not available.");
          setShowQr(false);
          clearInterval(poll);
          return;
        }
        const status = await xumm.payload.get(response.uuid);
        const nftokenId = null;
        if (status && status.meta.signed) {
          setUserInfo({ name: userName, avatar, tokenId: nftokenId || "UNKNOWN" });
          setMintStatus("NFT Minted! 🎉");
          setShowQr(false);
          clearInterval(poll);

          // Hide status after a 3 seconds
          setTimeout(() => {
            setMintStatus(null);
          }, 3000);
        } else if (status && status.meta.expired) {
          setMintStatus("Mint request expired.");
          setShowQr(false);
          clearInterval(poll);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      setMintStatus("Error minting NFT.");
      setShowQr(false);
      console.error("Error minting NFT:", error);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <div className="bg-yellow-100 p-8  rounded-xl shadow-lg w-full max-w-5xl h-full flex flex-col items-center gap-8">
        {/* ▼ Mint前 */}
        {!userInfo && (
          <div>
            <h1 className="text-xl font-bold text-center">
              Get Your Profile NFT!
            </h1>
            <Button 
              className="self-center px-8 py-2 bg-yellow-400 text-white text-lg font-semibold rounded-full shadow-md hover:bg-yellow-500 transition duration-200"
              onClick={() => setShowPopup(true)}
            >
              Mint NFT
            </Button>
          </div>
        )}
        
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

              {/* Avatar */}
              <div>
                <p className="font-bold text-gray-800 mb-2">Avatar image</p>
                <div className="flex justify-around">
                  <label className="flex flex-col items-center gap-1">
                    <input
                      type="radio"
                      name="avatar"
                      value="A"
                      checked={avatarType === 'A'}
                      onChange={() => setAvatarType('A')}
                    />
                    <img src="/public/assets/avatars/avatar-a001.jpg" alt="Type A" className="w-24 h-24" />
                    <span>Type A</span>
                  </label>

                  <label className="flex flex-col items-center gap-1">
                    <input
                      type="radio"
                      name="avatar"
                      value="B"
                      checked={avatarType === 'B'}
                      onChange={() => setAvatarType('B')}
                    />
                    <img src="/public/assets/avatars/avatar-b001.jpg" alt="Type B" className="w-24 h-24" />
                    <span>Type B</span>
                  </label>
                </div>
              </div>

              {/* 区切り線 */}
              <hr className="border-t border-yellow-400" />

              {/* Mintボタン */}
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold"
                onClick={() => {
                  handleMintNft(name, avatarType);
                  setShowPopup(false);
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
        {showQr && qrUrl && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
              <img src={qrUrl} alt="Mint NFT QR" className="w-48 h-48" />
              <p className="mt-2 text-yellow-700 font-semibold">
                Scan with Xumm to mint NFT Or Accept the request in Xumm app
              </p>
              <Button
                className="mt-4 bg-red-500 text-white"
                onClick={() => setShowQr(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
        {mintStatus && (
          <div className="mt-4 text-lg font-bold text-green-700">{mintStatus}</div>
        )}

        {/* ▼ Mint後 */}
        {userInfo && (
          <div className="p-6 rounded-xl flex gap-8 items-center justify-center mt-6">
            {/* アバター画像 */}
            <img
              src={`/assets/avatars/avatar-${userInfo.avatar === 'A' ? 'a001' : 'b001'}.jpg`}
              alt="User Avatar"
              className="w-48 h-48 object-contain"
            />

            {/* 名前とリンク */}
            <div className="flex flex-col items-start">
              <p className="text-lg font-bold text-gray-800">{userInfo.name}</p>
              <a
                href={`https://dev.bithomp.com/en/nft/${userInfo.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline text-sm flex items-center gap-1"
              >
                NFT details
                <img
                  src="/public/assets/icons/125_arr_hoso.svg"
                  alt="open in new tab"
                  className="w-4 h-4"
                />
              </a>

              {/* ごはんボタン */}
              <button className="mt-4 px-4 py-2 rounded bg-yellow-400 hover:bg-yellow-500 text-white font-semibold">
                Have a Meal
              </button>
            </div>

            {/* グラフ（Chart.js） */}
          </div>
        )}
      </div>
    </div>
  );
}