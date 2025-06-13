import { useXumm } from "../contexts/XummContext";
import type { NftListItem } from "../contexts/XummContext";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useState, useEffect } from "react";
import { createNFTokenModifyPayload } from "@repo/utils/nftokenModify";
import { stringToHex } from "@repo/utils/stringToHex"; 
import * as xrpl from "xrpl";
import { LoadingOverlay } from "@repo/ui/loadingOverlay";

// 型定義（体形）
type BodyType = 'thin' | 'average' | 'fat';
// 型定義（ユーザー情報）
type UserInfo = {
  name: string;
  avatar: 'A' | 'B';
  tokenId: string;
  body_type: BodyType;
  image: string; // アバター画像のIPFS URL
};

export function HomePage() {
  const { xumm, nftList } = useXumm();
  const account = xumm.state.account;

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showMealPopup, setShowMealPopup] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [mealTime, setMealTime] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Breakfast');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [name, setName] = useState('');
  const [avatarType, setAvatarType] = useState<'A' | 'B'>('A');
  const [oldAvatarPayload, setOldAvatarPayload] = useState<any | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [nftListText, setNftListText] = useState<string | null>(null);
  const [petNftList, setPetNftList] = useState<any[]>([]);

  // アバター画像マッピング
  const avatarImageMap: Record<'A' | 'B', Record<BodyType, string>> = {
    A: {
      thin: '/src/assets/avatars/avatar-a001.jpg',
      average: '/src/assets/avatars/avatar-a002.jpg',
      fat: '/src/assets/avatars/avatar-a003.jpg',
    },
    B: {
      thin: '/src/assets/avatars/avatar-e001.jpg',
      average: '/src/assets/avatars/avatar-e002.jpg',
      fat: '/src/assets/avatars/avatar-e003.jpg',
    },
  };

  // 体型の種類
  const bodyTypeLevels = ["thin", "average", "fat"];

  // 体型レベルの計算用
  let level = null;

  // バックエンドAPIのURL
  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  /**
   * 最新NFT情報を取得する
   * ユーザーのアカウントに紐づくNFTの中から、最新のアバターNFTを検索し、userInfoなどの状態を更新
   * @returns 
   */
  const fetchAndSetLatestAvatar = async () => {
    try {
      // ローディング表示開始
      setIsLoadingAvatar(true);
      console.log("Fetching NFT List for account:", account);

      // nftListからavatarsを取り出す
      const avatars = ('avatars' in nftList) ? nftList.avatars as NftListItem[] : [];

      if (avatars) {
        const latestAvatarNft = avatars[0];
        console.log("Latest Avatat NFT List:", latestAvatarNft);

        if (latestAvatarNft) {
          const { NFTokenID, URI } = latestAvatarNft;

          const uriString = xrpl.convertHexToString(URI);
          const cid = uriString.replace("ipfs://", "");
          const responseUrl = await fetch(`${API_URL}/api/ipfs/geturlfromcid/${cid}`);
          const jsonUrl = await responseUrl.json();

          const responsePayload = await fetch(jsonUrl.url);
          const payload = await responsePayload.json();

          setOldAvatarPayload(payload);

          setUserInfo({
            name: payload.user_name,
            avatar: payload.avatarType,
            tokenId: NFTokenID,
            body_type: payload.body_type,
            image: payload.image,
          });

          if (payload.eat_time) {
            setRecentMeals([payload.eat_time]);
          } else {
            setRecentMeals([]);
          }

          console.log("Latest avatar NFT payload updated.");
        }
        
      } else {
        console.log("No avatar NFTs found in Context nftList.");
        setUserInfo(null);
        setRecentMeals([]);
      }
    } catch (error) {
      console.error("Error fetching NFT list or avatar payload:", error);
      setUserInfo(null);
      setRecentMeals([]);
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  /**
   * 体型レベル判定ロジック
   * currentBodyType と calories から次の body_type を判定
   * @param currentBodyType 現在の体型
   * @param calories 摂取カロリー
   * @returns 
   */
  const calculateNewBodyType = (currentBodyType: BodyType, calories: number): BodyType => {
    // 現在の体型のインデックス
    level = bodyTypeLevels.indexOf(currentBodyType);

    // カロリーに応じて体型レベルを調整
    if (calories >= 500) {
      level += 1;
    } else if (calories <= 100) {
      level -= 1;
    }
    level = Math.max(0, Math.min(bodyTypeLevels.length - 1, level));
    
    // 新しい体型を返す
    return bodyTypeLevels[level] as BodyType;
  };

  // useEffectで Context.nftList が更新されたら Avatarを再取得
  useEffect(() => {
    fetchAndSetLatestAvatar();
  }, [nftList]);

  /**
   * NFTミント処理
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
      const avatarImageUrl = avatarImageMap[avatar]['average'];

      // アバター画像をfetchしてBlob化
      const imageResponse = await fetch(avatarImageUrl);
      const imageBlob = await imageResponse.blob();

      const avatarImageFileName = avatarImageUrl.split('/').pop() || `${avatar}.jpg`;

      // FormDataオブジェクトを作成し、画像を添付
      const formData = new FormData();
      formData.append("avatarImage", imageBlob, avatarImageFileName);

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

      // 現在の日付と時刻を取得
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため+1
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      // const formattedDate = now.toISOString().replace('T', ':').substring(0, 19);

      // dateフォーマット 'YYYY-MM-DD:HH:MM:SS'
      const formattedDate = `${year}-${month}-${day}:${hours}:${minutes}:${seconds}`;

      // NFTのメタデータを作成
      const metadata = {
        user_name: userName,
        image:ipfsUrl,
        avatarType: avatar,
        date: formattedDate,
        type: 'avatar',
        body_type: 'average',
      };
      console.log(`ミント時のメタデータ： ${metadata}`)

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
        URI: xrpl.convertStringToHex(metadataIpfsUrl), // URIはHexエンコードで送信
        Flags: 16, // Dynamic NFT:16(tfMutableフラグ)
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
                  setUserInfo({
                    name: userName,
                    avatar,
                    tokenId,
                    body_type: 'average', // Mint時は 'average' 固定
                    image: ipfsUrl, // Mint時にアップロードしたアバター画像
                  });
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
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  /**
   * NFTのメタデータを更新する
   * @param newMealDescription 食事内容
   * @param newCalories カロリー
   * @param selectedMealTime 食事時間（日付と時刻）
   */
  const handleUpdateNftMetadata = async (newMealDescription: string, newCalories: number, selectedMealTime: 'Breakfast' | 'Lunch' | 'Dinner') => {
    // 現在の日付と時刻を取得
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため+1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    // const formattedDate = now.toISOString().replace('T', ':').substring(0, 19);

    // dateフォーマット 'YYYY-MM-DD:HH:MM:SS'
    const formattedDate = `${year}-${month}-${day}:${hours}:${minutes}:${seconds}`;
    console.log(selectedMealTime);

    const updatedEatTime = {
      name: newMealDescription,
      date: formattedDate, // 現在時刻と選択された食事時間を組み合わせる
      calories: newCalories,
    };

    const currentBodyType = userInfo?.body_type;
    const currentImageIpfsUrl = userInfo?.image;

    const newBodyType = calculateNewBodyType(currentBodyType as BodyType, newCalories);

    let newImageIpfsUrl: string = currentImageIpfsUrl ?? "";

    // 画像差し替えが必要ならIPFSにアップロード
    if (newBodyType !== currentBodyType) {
      console.log(`Body type changed: ${currentBodyType} → ${newBodyType}, uploading new avatar image...`);

      if (!userInfo) {
        throw new Error("userInfo is not available.");
      }
      const avatarType: 'A' | 'B' = userInfo.avatar;
      const avatarImagePath = avatarImageMap[avatarType][newBodyType];

      // アバター画像をfetchしてBlob化
      const imageResponse = await fetch(avatarImagePath);
      const imageBlob = await imageResponse.blob();

      // FormDataオブジェクトを作成し、画像を添付
      const formData = new FormData();
      formData.append("avatarImage", imageBlob, `${avatarType}-${newBodyType}.jpg`);

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
      const uploadedImageUrl: string = uploadFileData.ipfsUrl;
      if (!uploadedImageUrl) {
        throw new Error("Failed to get uploaded avatar image URL.");
      }
      newImageIpfsUrl = uploadedImageUrl;
      console.log("New avatar image uploaded to IPFS:", newImageIpfsUrl);
    } else {
      console.log("Body type unchanged. Keeping current avatar image.");
    }

    // メタデータJSON更新
    const updatedMetadata = {
      user_name: userInfo ? userInfo.name : '',
      image: newImageIpfsUrl,
      avatarType: userInfo ? userInfo.avatar : '',
      date: oldAvatarPayload?.date || '',
      type: 'avatar',
      body_type: newBodyType,
      eat_time: updatedEatTime,
    };

    const uploadJsonResponse = await fetch(`${API_URL}/api/avatar/create/upload-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMetadata),
    });

    // エラーハンドリング
    if (!uploadJsonResponse.ok) {
      throw new Error("Failed to upload updated metadata to IPFS.");
    }

    const uploadJsonData = await uploadJsonResponse.json();
    const metadataIpfsUrl = `ipfs://${uploadJsonData.cid}`;
    console.log("Updated metadata uploaded to IPFS:", metadataIpfsUrl);

    const tokenId = userInfo?.tokenId;
    if (!tokenId) {
      console.error("TokenID is not available.");
      return;
    }

    // NFTokenModify payload を作成
    const nftModifyPayload = createNFTokenModifyPayload({
      Account: account!,
      NFTokenID: tokenId,
      Flags: 0, // mutableな場合は 0、immutableにするなら 1（今回は更新なので 0）
      URI: stringToHex(metadataIpfsUrl),
    });

    // Xumm 経由で署名リクエスト送信(QRコード表示)
    setShowQr(true);

    const payloadResponse = await xumm.payload?.create(nftModifyPayload as any);

    // エラーハンドリング
    if (!payloadResponse) {
      setMintStatus("Failed to create NFTokenModify payload.");
      setShowQr(false);
      return;
    }

    const payloadUuid = payloadResponse.uuid;
    const qrPng = payloadResponse.refs.qr_png;

    // QRコードを画面にセット
    setQrUrl(qrPng || null);
    console.log("NFTokenModify Payload created. Waiting for signature...");

    // ポーリングで署名確認
    let isSigned = false;

    const poll = setInterval(async () => {
      if (!xumm.payload) {
        setMintStatus("Xumm payload is not available.");
        setShowQr(false);
        clearInterval(poll);
        return;
      }

      const status = await xumm.payload?.get(payloadUuid);

      if (status && status.meta.signed) {
        if (!isSigned) {
          console.log("NFTokenModify payload signed!");
          isSigned = true;
          setMintStatus("NFT metadata updated! 🎉");
          setShowQr(false);
          clearInterval(poll);

          // UI更新
          setUserInfo({
            ...userInfo!,
            body_type: newBodyType,
            image: newImageIpfsUrl,
          });

          // 状態メッセージを3秒後に非表示にする
          setTimeout(() => {
            setMintStatus(null);
          }, 3000);

        }
      } else if (status && status.meta.expired) {
        setMintStatus("Modify request expired.");
        setShowQr(false);
        clearInterval(poll);
      }
    }, 2000);

    console.log("Updated NFT Metadata:", updatedMetadata);

    // 最新NFT情報を再取得する
    await fetchAndSetLatestAvatar();
  };

  /**
   * NFTリストを読み込む
   * @param list 
   * @returns アバターNFTリスト
   */
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

  /**
   * NFTリスト取得ボタンの処理
   */
  const handleGetNftListClick = async () => {
    try {
      console.log("Getting NFT list...");

      setNftListText(null);

      // アバターNFTリストのペイロードを読み込む
      if (nftList && "avatars" in nftList && Array.isArray(nftList.avatars)) {
        const avatarList = await loadNftList(nftList.avatars);
        setNftListText(JSON.stringify(avatarList));
        console.log("アバターNFTリストのペイロード:", nftListText);

        const eatTimeList = avatarList.map((nft: any) => nft.payload.eat_time).filter((eatTime: any) => eatTime !== undefined && eatTime !== null);

        // 最新の順に並び変える
        eatTimeList.sort((a, b) => {
          const dataA = new Date(a.date).getTime();
          const dataB = new Date(b.date).getTime();
          return dataB - dataA;
        });

        // 直近5件のみ表示
        setRecentMeals(eatTimeList.slice(0, 5));

        // 比較表示をONにする
        setShowCompare(true);
      } else {
        console.log("No avatar list available.");
      }

      // ペットNFTリストのペイロードを読み込む
      if ("pets" in nftList && Array.isArray(nftList.pets)) {
        const petList = await loadNftList(nftList.pets);
        setPetNftList(petList);
      }

    } catch (error) {
      console.error("Error getting NFT list:", error);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full">

      {/* ▼ Loading */}
      {isLoadingAvatar && (
        <LoadingOverlay message="Loading ..." />
      )}

      {/* ▼ Mint前 */}
      {!userInfo && (
        <div className="w-full">
          {/* Mintエリア */}
          <div className="bg-yellow-100 p-8 rounded-xl shadow-lg w-full max-w-5xl mx-auto h-full flex flex-col items-center gap-8">
            {/* ▼ Mintステータス */}
            {mintStatus && (
              <div className="mt-4 text-lg font-bold text-green-700">{mintStatus}</div>
            )}

            <h1 className="text-xl font-bold text-center">Get Your Profile NFT!</h1>
            <Button
              className="self-center px-8 py-2 bg-yellow-400 text-black text-lg font-semibold rounded-full shadow-lg hover:bg-yellow-500 transition duration-200"
              onClick={() => setShowPopup(true)}
            >
              Mint NFT
            </Button>
          </div>

          {/* Your dPets セクション */}
          <div className="bg-yellow-400 p-8 rounded-xl w-full max-w-5xl mx-auto mt-12 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 self-start w-full">Your dPets</h2>
            <hr className="border-t border-yellow-100 mb-6 w-full" />

            {/* Get dPet */}
            <div className="flex flex-col items-center gap-4 mt-8">
              <h3 className="text-xl font-bold text-center">Get Your dPet!</h3>
              <Button
                className="px-8 py-2 bg-yellow-100 text-black text-lg font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition duration-200"
                onClick={() => {
                  console.log('dPet購入画面へ遷移');
                }}
              >
                Get dPet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ▼ Mint後 */}
      {userInfo && (
        <div className="w-full">
          {/* Profileエリア */}
          <div className="bg-yellow-100 p-8 rounded-xl shadow-lg w-full max-w-5xl mx-auto h-full flex flex-col items-center gap-8">
            {/* ▼ Mintステータス */}
            {mintStatus && (
              <div className="mt-4 text-lg font-bold text-green-700">{mintStatus}</div>
            )}

            {/* 上エリア：flex-row */}
            <div className="flex w-full gap-8">
              {/* 左エリア */}
              <div className="flex flex-col items-center flex-1 gap-4">
                {/* アバター画像 */}
                <img
                  src={avatarImageMap[userInfo.avatar][userInfo.body_type]}
                  alt="User Avatar"
                  className="w-48 h-48 object-contain"
                />

                {/* 名前とリンク・ボタン */}
                <div className="flex flex-col items-center gap-2">
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
                </div>
              </div>

              {/* 右エリア */}
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* グラフ */}
                <h3 className="text-lg font-bold mb-2">Recent Meals</h3>
                {recentMeals.length === 0 ? (
                  <p className="text-gray-600">No meal data available.</p>
                ) : (
                  <table className="w-full text-sm border border-gray-300">
                    <thead>
                      <tr className="bg-blue-500">
                        <th className="border border-gray-300 px-2 py-1">Date</th>
                        <th className="border border-gray-300 px-2 py-1">Meal</th>
                        <th className="border border-gray-300 px-2 py-1">Calories</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMeals.map((meal, index) => (
                        <tr key={index} className="text-center">
                          <td className="border border-gray-300 px-2 py-1">{meal.date}</td>
                          <td className="border border-gray-300 px-2 py-1">{meal.name}</td>
                          <td className="border border-gray-300 px-2 py-1">{meal.calories}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
            {/* 下エリア */}
            <div className="flex justify-center mt-4">
              {/* ごはんボタン */}
              <Button
                className="self-center px-8 py-2 bg-yellow-400 text-black text-lg font-semibold rounded-full shadow-lg hover:bg-yellow-500 transition duration-200"
                onClick={() => {
                  setShowMealPopup(true)
                }}
              >
                Have a Meal
              </Button>
            </div>

            <div className="flex justify-center mt-4">
              {/* NFTリスト取得ボタン */}
              <Button
                className="self-center px-8 py-2 bg-green-400 text-black text-lg font-semibold rounded-full shadow-lg hover:bg-green-500 transition duration-200"
                onClick={handleGetNftListClick}
              >
                Get NFT List (Check Latest Avatar)
              </Button>
            </div>

            {/* 比較表示 */}
            {showCompare && oldAvatarPayload && userInfo && (
              <div className="mt-4 p-4 border rounded bg-gray-100 text-sm w-full max-w-5xl mx-auto">
                <h3 className="text-lg font-bold mb-2">Avatar NFT Metadata (Before → After)</h3>
                <p><strong>Body Type:</strong> {oldAvatarPayload.body_type} → {userInfo.body_type}</p>
                <p><strong>Image:</strong> {oldAvatarPayload.image} → {userInfo.image}</p>
                <p><strong>Name:</strong> {oldAvatarPayload.user_name} → {userInfo.name}</p>
                <p><strong>Avatar Type:</strong> {oldAvatarPayload.avatarType} → {userInfo.avatar}</p>
              </div>
            )}
          </div>

          {/* Your dPets セクション */}
          <div className="bg-yellow-400 p-8 rounded-xl w-full max-w-5xl mx-auto mt-12 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 self-start w-full">Your dPets</h2>
            <hr className="border-t border-yellow-100 mb-6 w-full" />

            {/* dPets */}
            {petNftList.length === 0 ? (
              <p className="text-gray-600">No dPets available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {petNftList.map((pet, index) => (
                  <div key={index} className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
                    <img 
                      src={`https://gateway.pinata.cloud/ipfs/${pet.payload.image}`}
                      alt={pet.payload.pet_name}
                      className="w-40 h-40 object-cover rounded-lg shadow"
                    />
                    <p className="mt-2 text-lg font-bold">{pet.payload.pet_name}</p>
                    <p className="text-sm text-gray-600">Type: {pet.payload.pet_type}</p>
                    <p className="text-sm text-gray-600">Generation: {pet.payload.generations}</p>
                    <a
                      href={`https://dev.bithomp.com/en/nft/${pet.NFTokenID}`}
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
                  </div>
                ))}
              </div>
            )}
            

            <div className="flex justify-center mt-4">
              {/* ごはんボタン */}
              <Button
                className="self-center px-8 py-2 bg-yellow-100 text-black text-lg font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition duration-200"
                onClick={() => {
                    console.log('Meal Time clicked');
                  }}
              >
                Meal Time
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <img src="/src/assets/avatars/avatar-a002.jpg" alt="Type A" className="w-24 h-24" />
                  <span>Type A</span>
                </label>

                <label className="flex flex-col items-center gap-1">
                  <input
                    disabled
                    type="radio"
                    name="avatar"
                    value="B"
                    checked={avatarType === 'B'}
                    onChange={() => setAvatarType('B')}
                  />
                  <img src="/src/assets/avatars/avatar-e002.jpg" alt="Type B" className="w-24 h-24" />
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
                // ローディング表示開始
                setIsLoadingAvatar(true);
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

      {/* ▼ Have a Mealポップアップ */}
      {showMealPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
          <div className="bg-yellow-100 p-6 rounded-xl shadow-lg w-96 flex flex-col gap-4">
            {/* What did you eat? */}
            <label className="font-bold text-gray-800">
              What did you eat?
              <Input
                type="text"
                value={mealDescription} // mealDescription は食事内容を保持するState
                onChange={(e) => setMealDescription(e.target.value)} // setMealDescription はState更新関数
                placeholder="e.g., Chicken salad, Pasta"
                className="mt-1 w-full p-2 border border-gray-300 rounded"
              />
            </label>

            {/* Calories */}
            <label className="font-bold text-gray-800">
              Calories
              <Input
                type="number"
                value={calories} // calories はカロリーを保持するState
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setCalories(''); // 空文字列の場合はそのままStateを更新
                  } else {
                    const parsedValue = parseInt(value, 10);
                    if (!isNaN(parsedValue)) { // 数値に変換できたか確認
                      setCalories(parsedValue); // 数値に変換してStateを更新
                    } else {
                      // 例: 無効な入力があった場合の処理 (エラー表示など)
                      setCalories(''); // またはエラー状態に
                    }
                  }
                }} // setCalories はState更新関数
                placeholder="e.g., 500"
                className="mt-1 w-full p-2 border border-gray-300 rounded"
              />
            </label>

            {/* Meal Time */}
            <div>
              <p className="font-bold text-gray-800 mb-2">Meal Time</p>
              <div className="flex justify-around">
                <label className="flex items-center gap-1">
                  <Input
                    type="radio"
                    name="mealTime"
                    value="Breakfast"
                    checked={mealTime === 'Breakfast'}
                    onChange={() => setMealTime('Breakfast')} // setMealTime は食事時間を保持するState更新関数
                  />
                  <span>Breakfast</span>
                </label>

                <label className="flex items-center gap-1">
                  <Input
                    type="radio"
                    name="mealTime"
                    value="Lunch"
                    checked={mealTime === 'Lunch'}
                    onChange={() => setMealTime('Lunch')}
                  />
                  <span>Lunch</span>
                </label>

                <label className="flex items-center gap-1">
                  <Input
                    type="radio"
                    name="mealTime"
                    value="Dinner"
                    checked={mealTime === 'Dinner'}
                    onChange={() => setMealTime('Dinner')}
                  />
                  <span>Dinner</span>
                </label>
              </div>
            </div>

            {/* 区切り線 */}
            <hr className="border-t border-yellow-400" />

            {/* Updateボタン */}
            <Button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
              onClick={() => {
                const parsedCalories = typeof calories === 'number' ? calories : 0;
                handleUpdateNftMetadata(mealDescription, parsedCalories, mealTime);
                setShowMealPopup(false);
                setMealDescription('');
                setCalories('');
                setMealTime('Breakfast');
              }}
            >
              Update
            </Button>

            {/* Closeボタン */}
            <Button
              className="text-sm text-red-600 underline"
              onClick={() => setShowMealPopup(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ▼ QRコード */}
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

    </div>
  );
}