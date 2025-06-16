import { useState, useEffect, useCallback } from "react";
import { useXumm } from "@repo/frontend/contexts/XummContext";
import NFTList, { type NFTItem } from "@repo/ui/nftlist";
import { LoadingOverlay } from "@repo/ui/loadingOverlay";
import { MemoriesPopup } from "./MemoriesPopup";
import { MealUploadPopup } from "./MealUploadPopup";
// import { Button } from "@repo/ui/button";


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
    // TODO 画面リフレッシュ処理
    // async function buildNftItems() {
    //   if (!petNftList) {
    //     setNftItems([]);
    //     return;
    //   }
    //   let pets: any[] = petNftList;
    //   const items: NFTItem[] = pets.map((pet) => {
    //     const meta = pet.payload;
    //     console.log("Pet Metadata:", meta);
    //     return {
    //       //add pet types and gen
    //       id: pet.NFTokenID,
    //       name: meta.pet_name || pet.NFTokenID,
    //       image: meta.image
    //         ? meta.image.replace("ipfs://", "http://gateway.pinata.cloud/ipfs/")
    //         : "",
    //       detailsUrl: `https://dev.xrplexplorer.com/en/nft/${pet.NFTokenID}`,
    //       meta,
    //       onMealTime: () => {
    //         setSelectedMealNft({
    //           id: pet.NFTokenID,
    //           name: meta.pet_name || pet.NFTokenID,
    //           image: meta.image
    //             ? meta.image.replace(
    //               "ipfs://",
    //               "http://gateway.pinata.cloud/ipfs/"
    //             )
    //             : "",
    //           detailsUrl: `https://dev.xrplexplorer.com/en/nft/${pet.NFTokenID}`,
    //           meta,
    //         });
    //         setMealPopupOpen(true);
    //       },
    //       onMemory: () =>
    //         setSelectedMemoryNft({
    //           id: pet.NFTokenID,
    //           name: meta.pet_name || pet.NFTokenID,
    //           image: meta.image
    //             ? meta.image.replace(
    //               "ipfs://",
    //               "http://gateway.pinata.cloud/ipfs/"
    //             )
    //             : "",
    //           detailsUrl: `https://dev.xrplexplorer.com/en/nft/${pet.NFTokenID}`,
    //           meta,
    //         }),
    //     };
    //   });
    //   setNftItems(items);
    //   setMemoriesPopupOpen(true);
    //   console.log("NFT Items:", items);
    // }

    // async function fetchModifyListData() {
    //   if (!account) return;
    //   setLoadingNfts(true);
    //   try {
    //     const res = await fetch(`${API_URL}/api/xrpl/modifylist/${account}`);
    //     if (res.ok) {
    //       const data = await res.json();
    //       setModifyListData(data);
    //     } else {
    //       setModifyListData(null);
    //     }
    //   } catch (err) {
    //     setModifyListData(null);
    //   } finally {
    //     setLoadingNfts(false);
    //   }
    // }

    // fetchModifyListData();
    // fetchAndSetNftList();
    // buildNftItems();
    console.log("NFT modify list data:", modifyListData);

  }, [petNftList, nftList, account]);

    const buildNftItems = useCallback(() => {

      console.log("buildNftItems");

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
    }, [petNftList]);

    const fetchModifyListData = useCallback(async () => {
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
    }, [account]);

  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  // NFTリストを読み込む
  const loadNftList = useCallback(async (list: object[]) => {
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
  }, []);

  const fetchAndSetNftList = useCallback(async () => {
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
  }, [nftList, loadNftList]);

  useEffect(() => {
    const loadAllData = async () => {
      if (account && API_URL) { // Only proceed if account and API_URL are available
        setLoadingNfts(true);
        setError(null);
        try {
          console.log("useEffect: Starting data load sequence...");
          await fetchModifyListData();
          await fetchAndSetNftList(); // This will set petNftList
          // buildNftItems will be called by the other useEffect when petNftList changes
          console.log("useEffect: Data load sequence completed (modifyList and petNftList potentially set).");
        } catch (err) {
          console.error("useEffect: Error during data load sequence:", err);
          setError(err instanceof Error ? err.message : "Failed to load page data.");
          setNftItems([]); // Clear items on error
          setPetNftList(null);
          setModifyListData(null);
        } finally {
          setLoadingNfts(false);
        }
      } else {
        // Clear data if no account or API_URL
        setNftItems([]);
        setPetNftList(null);
        setModifyListData(null);
        setError(account ? "Backend URL not configured." : null);
        setLoadingNfts(false);
      }
    };

    loadAllData();
  }, [account, nftList, fetchModifyListData, fetchAndSetNftList]); // Dependencies for initial load

  // useEffect to build items when petNftList (from backend) changes
  useEffect(() => {
    if (petNftList !== null) { // Only build if petNftList has been set (even if empty array)
        console.log("useEffect: petNftList changed, calling buildNftItems.");
        buildNftItems();
    } else if (!loadingNfts && account) { // If not loading and logged in, but petNftList is null (e.g. error or no pets)
        setNftItems([]); // Ensure nftItems is cleared
    }
  }, [petNftList, buildNftItems, loadingNfts, account]);

  const handleMealPopupClose = async () => {
    setSelectedMealNft(null);
    setMealPopupOpen(false);
    // Reload NFT list
    await fetchAndSetNftList();
  };

  
  // const handleReload = async () => {
  //   await fetchModifyListData();
  //   await fetchAndSetNftList();
  //   await buildNftItems();
  // };
  
  // console.log("nftitems:", nftItems);

  return (
    <div>
      {loadingNfts && <LoadingOverlay message="Loading NFTs..." />}

      <div>
            {/* リロードボタン(Debug用) */}
            {/* <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold"
              onClick={() => {
                handleReload();
              }}
            >
              Reload
            </Button> */}
        </div>



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
          onClose={handleMealPopupClose}
          open={mealPopupOpen}
          account={account}
        />
      )}

      {error && <div style={{ color: "yellow" }}>{error}</div>}
    </div>
  );
}
