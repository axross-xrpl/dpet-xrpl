// import * as xrpl from "xrpl";
import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { Popup } from "@repo/ui/popup";
import { useXumm } from "@repo/frontend/contexts/XummContext";
// import { createNFTokenModifyPayload } from "@repo/utils/nftokenModify";
import { getFormattedDate } from "@repo/utils/getFormattedDate";
import { type PetData, PetDataList } from "@repo/frontend-dpet/petData";
import { analyzeImageWithAI } from "@repo/utils/analyzeImage";

interface MealUploadPopupProps {
  open: boolean;
  onClose: () => void;
  nft: any;
  account: string;
}

export const MealUploadPopup: React.FC<MealUploadPopupProps> = ({
  open,
  onClose,
  nft,
  account,
}) => {
  const { fetchNftList } = useXumm();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealAnalysis, setMealAnalysis] = useState<any>(null); // AI result
  const [secret, setSecret] = useState<string>("");
  const [growImage, setGrowImage] = useState<string | null>(null);

  // console.log("MealUploadPopup rendered with NFT:", nft);
  // console.log("Account:", account);

  // 画像をアップロード
  const uploadImage = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ipfs/uploadfile`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload file to backend");
    }

    const data = await response.json();
    return data.ipfsUrl;
  };

    // JSONをアップロード
  const uploadJson = async (jsonData: Object) => {
    // ファイルをIPFSへアップロードする
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ipfs/uploadjson`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jsonData }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload jsonData to backend");
    }

    const data = await response.json();
    return data.cid;
  };


  // NFT更新
  const modifyNft = async (tokenid: string, account: string, jsonCid: string) => {

    const request = {
      tokenid: tokenid,
      address: account,
      jsonUrl: `ipfs://${jsonCid}`,
    };
    const API_URL = import.meta.env.VITE_BACKEND_URL!;

    const response = await fetch(`${API_URL}/api/pet/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to modify NFT to backend");
    }

    const data = await response.json();
    console.log("data")
    console.log(data)

    return data.tokenid;
  };


  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedFile(null);
      setUploading(false);
      setError(null);
      setMealAnalysis(null);
      setSecret("");
      setGrowImage(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
    setError(null);
  };

  // Step 1: Upload & AI analysis
  const handleNext = async () => {
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const response = await analyzeImageWithAI(selectedFile);
      console.log("AI response:", response);
      let aiResult = response;

      if (aiResult && typeof aiResult.result === "string") {
            // Parse the JSON string
            aiResult = JSON.parse(aiResult.result);
        }
        console.log("Parsed AI result:", aiResult); 
      setMealAnalysis(aiResult); // Use the result from backend
      setStep(2);

    // --- Use dummy AI analysis output here ---
    // const aiResult = {
    //   "Category": "Alcohol/Beverage",
    //   "Calory": "100",
    //   "Energy type": "DYNAMISM",
    //   "Food name": "Ramen",
    //   "Impressions": "It was very good ramen! It's my favorite!"
    // };
    // setMealAnalysis(aiResult);
    // setStep(2);
    // --- End of dummy output ---

    } catch (err: any) {
      setError(`AI analysis failed. ${err.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Confirm & Update backend
  const handleUpdate = async () => {
    // if (!secret) {
    //   setError("Please enter your XRPL Secret.");
    //   return;
    // }
    setUploading(true);
    setError(null);
    try {
      // meal情報を取得
      const imageCid = await uploadImage(selectedFile);
      const mealData: any = {
        energyType: mealAnalysis["Energy type"] || "DYNAMISM",
        foodName: mealAnalysis["Food name"],
        impressions: mealAnalysis["Impressions"],
      };

      // meal情報をペイロードに追加
      const nextJsonData = {
        ...nft.meta,
        food_name: mealData.foodName,
        food_image: `ipfs://${imageCid}`,
        meal_date: getFormattedDate(new Date()),
        impressions: mealData.impressions,
      };

      const currentData = {
        petType: nft.meta.pet_type,
        generation: nft.meta.generations,
      };
      if (currentData.generation) {
        const currentPetInfo: PetData | undefined = PetDataList.find(
          (item) => item.petType === currentData.petType
        );

        const nextPetType: string | undefined =
          currentPetInfo?.nextGenerations.find(
            (item) => item.energyType === mealData.energyType
          )?.petType;
        if (nextPetType) {
          // 成長先のペット情報でペイロード情報を更新
          const nextPetInfo: PetData | undefined = PetDataList.find(
            (item) => item.petType === nextPetType
          );
          const imageUrl = `ipfs://${nextPetInfo?.imageCid}`;

          Object.assign(nextJsonData, {
            image: imageUrl,
            pet_type: nextPetType,
            generations: nextPetInfo?.generations,
          });
        }
      }
      // JSONデータをアップロード
      const jsonCid = await uploadJson(nextJsonData);

      modifyNft(nft.id, account, jsonCid);

      // const modifyPayload: any = createNFTokenModifyPayload({
      //   Account: account,
      //   NFTokenID: nft.id,
      //   URI: xrpl.convertStringToHex(`ipfs://${jsonCid}`),
      // });

      // console.log("Modify Payload:", modifyPayload);

      // const response = await xumm.payload?.create(modifyPayload);
      // if (!response) {
      //   throw new Error("Failed to create payload.");
      // }

      // 成長後の画像をセット
      setGrowImage(
        nextJsonData.image
          ? nextJsonData.image.replace(
              "ipfs://",
              "http://gateway.pinata.cloud/ipfs/"
            )
          : ""
      );

      // NFTリストを更新
      await fetchNftList(account);

      setStep(3);
    } catch (err: any) {
      setError("Backend update failed.");
    } finally {
      setUploading(false);
    }
  };

  // Step 3: Close
  const handleClose = () => {
    onClose();
  };

  return (
    <Popup
      open={open}
      onClose={onClose}
      title={
        <span className="flex flex-col items-center">
          <span className="font-bold text-xl mt-2">Meal Time</span>
          <span className="text-base">ポップアップ画面</span>
        </span>
      }
    >
      <div className="flex flex-col items-center w-full">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center">
            <div className="font-bold mb-2">Upload Meal Image</div>
            <div className="text-sm mb-2">File size limit: 3MB</div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-3 border rounded px-2 py-1 w-full"
              disabled={uploading}
            />
            {selectedFile && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-40 h-40 object-cover rounded mb-3 border-2 border-yellow-300 my-2"
              />
            )}
            <hr className="my-6 border-t-8 border-yellow-400" />
            <div className="text-sm mb-2">AIによる解析処理の所要時間: およそ2~5分</div>
            <Button
              onClick={handleNext}
              disabled={uploading || !selectedFile}
              className="mb-2"
            >
              {uploading ? "AIで画像解析中..." : "Next"}
            </Button>
            {error && <div className="text-red-500 mb-2">{error}</div>}
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && mealAnalysis && (
          <div className="w-full flex flex-col items-center">
            <div className="font-bold mb-2">Confirm Meal Details</div>
            <div>Detected Menu: {mealAnalysis.result["Food name"]}</div>
            <div>Total Estimated Calories: {mealAnalysis.result["Calory"]} kcal</div>
         {/*
            <div>Detected Menu: {mealAnalysis["Food name"]}</div>
            <div>Total Estimated Calories: {mealAnalysis.Calory} kcal</div>
          */}
            {selectedFile && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-40 h-40 object-cover rounded mb-3 border-2 border-yellow-300"
              />
            )}
            <div className="mb-2">Energy: {mealAnalysis.result["Energy"]}</div>
            <div className="mb-2">Energy Type: {mealAnalysis.result["Energy type"]}</div>
        {/*
            <div className="mb-2">
              Energy Type: {mealAnalysis["Energy type"]}
            </div>
         */}

            {/* <input
              type="text"
              className="mb-2 border rounded px-2 py-1 w-full"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Your XRPL Secret (on Devnet)"
              disabled={uploading}
            /> */}
            <Button
              onClick={handleUpdate}
              disabled={uploading || !secret}
              className="mb-2"
            >
              {uploading ? "アップロード中..." : "Update"}
            </Button>
            {error && <div className="text-red-500 mb-2">{error}</div>}
          </div>
        )}

        {/* Step 3: Grown */}
        {step === 3 && growImage && (
          <div className="w-full flex flex-col items-center">
            <div className="font-bold mb-2">They've Grown!</div>
            <img
              src={growImage}
              alt="Grown"
              className="w-40 h-40 object-cover rounded mb-3 border-2 border-yellow-300"
            />
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </div>
    </Popup>
  );
};
