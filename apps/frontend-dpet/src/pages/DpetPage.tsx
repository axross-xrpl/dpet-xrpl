import * as xrpl from "xrpl";
import { useState, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { createNFTokenModifyPayload } from "@repo/utils/nftokenModify";
import { useXumm } from "@repo/frontend/contexts/XummContext";
import NFTList, { type NFTItem } from "@repo/ui/nftlist";
import { MemoriesPopup } from "./MemoriesPopup";
import { MealUploadPopup } from "./MealUploadPopup";
import { LoadingOverlay } from "@repo/ui/loadingOverlay";

export function DpetPage() {
  const { xumm, nftList, fetchNftList } = useXumm();
  const account = xumm.state.account;
  const [nftItems, setNftItems] = useState<NFTItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [petNftList, setPetNftList] = useState<object[] | null>(null);
  const [nftModifyText, setNftModifyText] = useState<string | null>(null);

  const [selectedMemoryNft, setSelectedMemoryNft] = useState<NFTItem | null>(
    null
  );
  const [modifyListData, setModifyListData] = useState<any>(null);
  const [memoriesPopupOpen, setMemoriesPopupOpen] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [mealPopupOpen, setMealPopupOpen] = useState(false);
  const [selectedMealNft, setSelectedMealNft] = useState<NFTItem | null>(null);

  useEffect(() => {
    async function buildNftItems() {
      if (!petNftList) {
        setNftItems([]);
        return;
      }
      let pets: any[] = petNftList;
      const items: NFTItem[] = pets.map((pet) => {
        const meta = pet.payload;
        console.log("Pet Metadata:", meta);
        return {
          //add pet types and gen
          id: pet.NFTokenID,
          name: meta.pet_name || pet.NFTokenID,
          image: meta.image
            ? meta.image.replace("ipfs://", "http://gateway.pinata.cloud/ipfs/")
            : "",
          detailsUrl: `https://dev.xrplexplorer.com/en/nft/${pet.NFTokenID}`,
          onMealTime: () => {
            setSelectedMealNft({
              id: pet.NFTokenID,
              name: meta.pet_name || pet.NFTokenID,
              image: meta.image
                ? meta.image.replace(
                    "ipfs://",
                    "http://gateway.pinata.cloud/ipfs/"
                  )
                : "",
              detailsUrl: `https://dev.xrplexplorer.com/en/nft/${pet.NFTokenID}`,
            });
            setMealPopupOpen(true);
          },
          onMemory: () =>
            setSelectedMemoryNft({
              id: pet.NFTokenID,
              name: meta.pet_name || pet.NFTokenID,
              image: meta.image
                ? meta.image.replace(
                    "ipfs://",
                    "http://gateway.pinata.cloud/ipfs/"
                  )
                : "",
              detailsUrl: `https://dev.xrplexplorer.com/en/nft/${pet.NFTokenID}`,
            }),
        };
      });
      setNftItems(items);
      setMemoriesPopupOpen(true);
      console.log("NFT Items:", items);
    }

    async function fetchAndSetNftList() {
      setLoadingNfts(true);
      if (nftList && "pets" in nftList && Array.isArray(nftList.pets)) {
        try {
          const petList = await loadNftList(nftList.pets);
          setPetNftList(petList);
        } catch (err: any) {
          setError(err.message || "Failed to load NFT list.");
        } finally {
          setLoadingNfts(false);
        }
      } else {
        setError("No pet list available.");
      }
    }

    async function fetchModifyListData() {
      if (!account) return;
      setLoadingNfts(true);
      try {
        const res = await fetch(`${API_URL}/api/xrpl/modifylist/${account}`);
        if (res.ok) {
          const data = await res.json();
          setModifyListData(data);
        } else {
          setModifyListData(null);
        }
      } catch (err) {
        setModifyListData(null);
      } finally {
        setLoadingNfts(false);
      }
    }

    fetchModifyListData();
    fetchAndSetNftList();
    buildNftItems();
    console.log("NFT modify list data:", modifyListData);
  }, [petNftList, nftList, account]);

  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  // 現在日時を取得し、フォーマット'YYYY-MM-DD:hh:mm:ss'で返す
  // TODO 汎用化してNFT作成、更新時に使う
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

  // TODO 更新処理はポップアップで行う。実装後に削除
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
      setError(err.message || "Error modifying NFT.");
    }
  };

  console.log("nftitems:", nftItems);

  return (
    <div>
      {loadingNfts && <LoadingOverlay message="Loading NFTs..." />}

      {/* ペットNFT一覧 */}
      {nftItems && (
        <div className="mt-4">
          <NFTList nfts={nftItems} />
        </div>
      )}
      {selectedMemoryNft && (
        <MemoriesPopup
          NFTokenID={selectedMemoryNft.id}
          onClose={() => setSelectedMemoryNft(null)}
          open={memoriesPopupOpen}
          modifyListData={modifyListData}
        />
      )}
      {selectedMealNft && (
        <MealUploadPopup
          nft={selectedMealNft}
          onClose={() => setSelectedMealNft(null)}
          open={mealPopupOpen}
          account={account}
        />
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
