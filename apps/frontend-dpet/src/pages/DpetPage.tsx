import { useState, useEffect } from "react";
import { useXumm } from "@repo/frontend/contexts/XummContext";
import NFTList, { type NFTItem } from "@repo/ui/nftlist";
import { LoadingOverlay } from "@repo/ui/loadingOverlay";
import { MemoriesPopup } from "./MemoriesPopup";
import { MealUploadPopup } from "./MealUploadPopup";

export function DpetPage() {
  const { xumm, nftList } = useXumm();
  const account = xumm.state.account;

  const [nftItems, setNftItems] = useState<NFTItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [petNftList, setPetNftList] = useState<object[] | null>(null);
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
          meta,
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
              meta,
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
              meta,
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

      {error && <div style={{ color: "yellow" }}>{error}</div>}
    </div>
  );
}
