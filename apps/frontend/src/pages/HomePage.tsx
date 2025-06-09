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
  const avatarImageMap = { 
    A: "/src/assets/avatars/avatar-a001.jpg", 
    B: "/src/assets/avatars/avatar-b001.jpg", 
  };
  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  const handleMintNft = async (userName: string, avatar: 'A' | 'B') => {
    try {
      if (!xumm.payload) throw new Error("Xumm payload is not available.");
      if (!account) throw new Error("Account is not available.");

      console.log("Minting for:", userName, avatar);
    
      setMintStatus(null);
      setShowQr(true);
      setShowPopup(true);

      console.log("Uploading Avatar image to IPFS...");

      const avatarImageUrl = avatarImageMap[avatar];
      const imageResponse = await fetch(avatarImageUrl);
      const imageBlob = await imageResponse.blob();

      const formData = new FormData();
      formData.append("avatarImage", imageBlob, `${avatar}.jpg`);
      formData.append("userName", userName);
      formData.append("account", account);
      formData.append("avatarType", avatar);

      const response = await fetch(`${API_URL}/api/avatar/createavatar`, {
        method: "POST",
        body: formData,
      });

      if (!response) {
        setMintStatus("Failed to create payload.");
        setShowQr(false);
        return;
      }
      const data = await response.json();
      const payloadUuid = data.payloadUuid;
      const qrPng = data.qrPng;
      const metadataIpfsUrl = data.metadataIpfsUrl;

      console.log("NFT Mint Payload created. Waiting for signature...");

      setQrUrl(qrPng || null);

      let retryCount = 0;
      const maxRetries = 15;
      let isSigned = false;

      // Poll for status
      const poll = setInterval(async () => {
        if (!xumm.payload) {
          setMintStatus("Xumm payload is not available.");
          setShowQr(false);
          clearInterval(poll);
          return;
        }

        retryCount++;

        const response = await fetch(`${API_URL}/api/avatar/getpayloadstatus/${payloadUuid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch payload status.");
        }

        const status = await response.json();

        if (status && status.meta.signed) {
          if (!isSigned) {
            console.log("Payload signed! Starting NFT URI polling...");
            isSigned = true;
          }
          console.log("Payload signed! Checking account_nfts...", status);

          const mintedNft = await fetchNftsList(metadataIpfsUrl);
          if (mintedNft) {
            const tokenId = mintedNft.NFTokenID;
            console.log("Minted NFT TokenID:", tokenId);

            setUserInfo({ name: userName, avatar, tokenId });
            setMintStatus("NFT Minted! 🎉");
            setShowQr(false);
            clearInterval(poll);
          }else {
            console.log(`NFT with matching URI not found yet. Retry ${retryCount}/${maxRetries}...`);
            if (retryCount >= maxRetries) {
              setMintStatus("NFT Minting in progress. NFT may take some time to appear.");
              clearInterval(poll);
            }
          }

          // Hide status after a 3 seconds
          setTimeout(() => {
            setMintStatus(null);
          }, 3000);
        } else if (status && status.meta.expired) {
          setMintStatus("Mint request expired.");
          setShowQr(false);
          clearInterval(poll);
        }else {
          console.log(`Waiting for payload signature... Retry ${retryCount}/${maxRetries}`);
          
          if (retryCount >= maxRetries && !isSigned) {
            setMintStatus("Mint request is taking too long or failed.");
            setShowQr(false);
            clearInterval(poll);
          }
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      setMintStatus("Error minting NFT.");
      setShowQr(false);
      console.error("Error minting NFT:", error);
    }
  };

  const fetchNftsList = async (metadataIpfsUrl: string) => {
    try {
      if (!account) throw new Error("Account is not available.");

      const response = await fetch(`${API_URL}/api/xrpl/nfts/${account}`);
      if (!response.ok) {
        throw new Error("Failed to fetch NFT list.");
      }

      const data = await response.json();
      console.log("NFT List:", data);

      const accountNfts = data.result.account_nfts || [];

      // Decode hex-format URIs for match comparison
      const convertHexToString = (hex: string) => {
        if (!hex) return "";

        return decodeURIComponent(
          hex
            .replace(/^0+/, '')
            .match(/.{1,2}/g)!
            .map(byte => String.fromCharCode(parseInt(byte, 16)))
            .join('')
        );
      };

      const mintedNft = accountNfts.find((nft: any) => {
        if (!nft.URI) return false;

        const nftUriStr = convertHexToString(nft.URI);
        console.log("Comparing NFT URI:", nftUriStr, "vs", metadataIpfsUrl);

        return nftUriStr === metadataIpfsUrl;
      });

      console.log("minted NFT finded:", mintedNft);
      return mintedNft;
    } catch (error) {
      console.error("Error fetching NFT list:", error);
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
                    <img src="/src/assets/avatars/avatar-a001.jpg" alt="Type A" className="w-24 h-24" />
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
                    <img src="/src/assets/avatars/avatar-b001.jpg" alt="Type B" className="w-24 h-24" />
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
              src={`/src/assets/avatars/avatar-${userInfo.avatar === 'A' ? 'a001' : 'b001'}.jpg`}
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
                  src="/src/assets/icons/125_arr_hoso.svg"
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