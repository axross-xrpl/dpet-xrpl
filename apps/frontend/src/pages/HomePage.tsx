import { useXumm } from "../contexts/XummContext";
import { Button } from "@repo/ui/button";
import { useState } from "react";
import { convertStringToHex } from "xrpl";

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
  const eatTime = {
    name: 'ramen', 
    date: '2025-05-31:19:31:31', 
    calories: 450,
  }
  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  /**
   * [owner] NFTミント処理
   * @param userName ユーザーが入力した名前
   * @param avatar 選択したアバタータイプ（'A' または 'B'）
   */
  const handleMintNft = async (userName: string, avatar: 'A' | 'B') => {
    try {
      //  Xummペイロードとアカウント情報が利用可能かを確認
      if (!account) throw new Error("Account is not available.");
      if (!xumm.payload) throw new Error("Xumm payload is not available.");

      console.log("Minting for:", userName, avatar);
    
      // NFTミント処理の現在のステータス表示をリセット
      setMintStatus(null);

      // 名前とアバターを選択するポップアップを表示
      setShowPopup(true);

      // ---------------------------------------
      // 1.アバター画像をIPFSにアップロード
      // ---------------------------------------
      console.log("Uploading Avatar image to IPFS...");

      // 選択されたアバタータイプ（'A'or'B'）に対応する画像URLをavatarImageMapから取得
      const avatarImageUrl = avatarImageMap[avatar];

      // アバター画像をfetchしてBlob化
      const imageResponse = await fetch(avatarImageUrl);
      const imageBlob = await imageResponse.blob();

      // FormDataオブジェクトを作成し、画像を添付
      const formData = new FormData();
      formData.append("avatarImage", imageBlob, `${avatar}.jpg`);

      // アバター画像をIPFSへアップロード
      const uploadFileResponse = await fetch(`${API_URL}/api/avatar/create/upload-file`, {
        method: "POST",
        body: formData,
      });

      // エラーハンドリング
      if (!uploadFileResponse.ok) {
        throw new Error("Failed to uploading avatar image file to IPFS.");
      }

      // IPFS上のURLを取得
      const uploadFileData = await uploadFileResponse.json();
      const ipfsUrl = uploadFileData.ipfsUrl;
      console.log("Avatar Image uploaded to IPFS:", ipfsUrl);

      // ---------------------------------------
      // 2.メタデータJSONをIPFSにアップロード
      // ---------------------------------------
      console.log("Uploading NFT metadata to IPFS...");

      // NFTのメタデータを作成
      const metadata = {
        user_name: userName,
        image:ipfsUrl,
        avatarType: avatar,
        date: '2025/06/10',
        type: 'avatar',
        body_type: 'average',
        eat_time: eatTime
      };

      // メタデータJSONをIPFSへアップロード
      const uploadJsonResponse = await fetch(`${API_URL}/api/avatar/create/upload-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      // エラーハンドリング
      if (!uploadJsonResponse.ok) {
        throw new Error("Failed to uploading JSON to IPFS.");
      }

      // IPFS上のメタデータCIDからNFT用URIを生成
      const uploadJsonData = await uploadJsonResponse.json();
      const cid = uploadJsonData.cid;
      const metadataIpfsUrl = `ipfs://${cid}`;
      console.log("NFT metadata uploaded to IPFS:", metadataIpfsUrl);

      // ---------------------------------------
      // 3.NFTミント
      // ---------------------------------------
      console.log("Creating Xumm payload for NFT mint...");

      // QRコードをポップアップ表示開始
      setShowQr(true);

      // Xumm経由でNFTokenMintのペイロードを作成
      const payloadResponse = await xumm.payload?.create({
        TransactionType: "NFTokenMint",
        Account: account,
        URI: convertStringToHex(metadataIpfsUrl), // URIはHexエンコードで送信
        Flags: 8,
        NFTokenTaxon: 0,
      });

      // エラーハンドリング
      if (!payloadResponse) {
        setMintStatus("Failed to create payload.");
        setShowQr(false);
        return;
      }

      const payloadUuid = payloadResponse.uuid;    // ペイロードUUID（署名状態取得時に使用）
      const qrPng = payloadResponse.refs.qr_png;   // QRコードPNG（画面表示用）

      // QRコードを画面にセット
      setQrUrl(qrPng || null);
      console.log("NFT Mint Payload created. Waiting for signature...");

      // ---------------------------------------
      // 4.署名済みペイロードとtxidをポーリング、トークンIDを取得
      // ---------------------------------------
      let isSigned = false;

      // 2秒ごとにXummペイロードの署名状態を確認するポーリング
      const poll = setInterval(async () => {
        // 署名確認用APIが利用可能か確認
        if (!xumm.payload) {
          setMintStatus("Xumm payload is not available.");
          setShowQr(false);
          clearInterval(poll);
          return;
        }

        // 初期化
        let tokenId = null;
        let retryCount = 0;
        const maxRetries = 15;

        // ペイロードの署名状態を取得
        const status = await xumm.payload?.get(payloadUuid);

        // ペイロードが署名済みかどうか確認
        if (status && status.meta.signed) {
          // まだTokenID取得を開始していない場合のみ処理実行
          if (!isSigned) {
            console.log("Payload signed! Starting NFT TokenID polling...");
            isSigned = true;

            // 署名済ペイロードのトランザクションID（txid）を取得
            const txid = status.response.txid;
            console.log("txid:", txid);

            // 署名後2秒待ってから最初のTokenID取得開始
            console.log("Payload signed! Waiting 2 seconds before starting NFT TokenID polling...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待つ

            // TokenID retry loop
            // txidからNFT TokenIDを取得するまでリトライする
            while(retryCount < maxRetries) {
              try {
                console.log(`Fetching Token ID... attempt ${retryCount + 1}`);

                // NFT TokenIDを取得する
                const tokenIdResponse = await fetch(`${API_URL}/api/avatar/create/${txid}`);
                if (tokenIdResponse.ok) {
                  const tokenIdData = await tokenIdResponse.json();
                  tokenId = tokenIdData.tokenId;
                  console.log("NFT TokenID:", tokenId);

                  // UIを更新 & ポーリング停止
                  setUserInfo({ name: userName, avatar, tokenId });
                  setMintStatus("NFT Minted! 🎉");
                  setShowQr(false);
                  clearInterval(poll);

                  // 状態メッセージを3秒後に非表示にする
                  setTimeout(() => {
                    setMintStatus(null);
                  }, 3000);

                  
                  break; // retry loop終了
                } else {
                  // APIがエラーを返した場合、エラーをthrow
                  throw new Error("Failed to fetch NFT token ID.");
                }
              } catch (error) {
                // エラー内容をログ出力
                console.error("Error fetching NFT token ID:", error);

                // 次のリトライまで2秒待つ
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              retryCount++;
            }
            // retry loop終了後、tokenIdが未取得状態の場合、失敗メッセージを表示
            if (!tokenId) {
              setMintStatus("Failed to fetch NFT token ID after multiple attempts.");
              setShowQr(false);
              clearInterval(poll);
            }
          }          
        } else if (status && status.meta.expired) {
          // ペイロードが期限切れの場合、エラーメッセージを表示してポーリング停止
          setMintStatus("Mint request expired.");
          setShowQr(false);
          clearInterval(poll);
        }else {
          console.log(`Waiting for payload signature... Retry ${retryCount}/${maxRetries}`);
          
          retryCount++;
          // 最大リトライ数に達した場合、タイムアウトとみなして処理終了
          if (retryCount >= maxRetries) {
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