import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { Popup } from "@repo/ui/popup";
import { createNFTokenModifyPayload } from "@repo/utils/nftokenModify";
import { getFormattedDate } from "@repo/utils/getFormattedDate";
import { type PetData, PetDataList } from "@repo/frontend-dpet/petData";
import { analyzeImageWithAI } from "@repo/utils/analyzeImage";

interface MealUploadPopupProps {
  open: boolean;
  onClose: () => void;
  nft: any;
  account: string;
}

export const MealUploadPopup: React.FC<MealUploadPopupProps> =  ({
  open,
  onClose,
  nft,
  account,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealAnalysis, setMealAnalysis] = useState<any>(null); // AI result
  const [secret, setSecret] = useState<string>("");
  const [growImage, setGrowImage] = useState<string | null>(null);

  console.log("MealUploadPopup rendered with NFT:", nft);
  console.log("Account:", account);

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

  // AI からデータを取得
  // const aiData = await fetchAiData(selectedFile);
  // TODO ダミーデータ利用中
  const aiData = {
    Category: "Alcohol/Beverage",
    Calory: "100",
    "Energy type": "DYNAMISM",
    "Food name": "Ramen",
    Impressions: "It was very good ramen! It's my favorite!",
  };
  // setMealAnalysis(aiData);

  let nextJsonData = {
    ...nft.meta,
    date: getFormattedDate(new Date()),
  };

  const currentData = {
    petType: nft.meta.petType,
    generation: nft.meta.generations,
  };
  if (!currentData.generation) {
    const currentPetInfo: PetData | undefined = PetDataList.find(
      (item) => item.petType === currentData.petType
    );
    const energyType: string = aiData["Energy type"] || "DYNAMISM";

    const nextPetType: string | undefined =
      currentPetInfo?.nextGenerations.find(
        (item) => item.energyType === energyType
      )?.petType;
    if (nextPetType) {
      // 成長先のペット情報でペイロードを作成
      // ペット情報を更新する
      const nextPetInfo: PetData | undefined = PetDataList.find(
        (item) => item.petType === nextPetType
      );
      const imageUrl = `ipfs://${nextPetInfo?.imageCid}`;

      nextJsonData = {
        ...nft.meta,
        date: getFormattedDate(new Date()),
        image: imageUrl,
        pet_type: nextPetType,
        generations: nextPetInfo?.generations,
        food_name: aiData["Food name"],
        impressions: aiData["Impressions"],
      };
    }
  }
  // JSONデータをアップロード
  const jsonCid = await uploadJson(nextJsonData);

  const modifyPayload = createNFTokenModifyPayload({
    Account: account,
    NFTokenID: nft.id,
    URI: `ipfs://${jsonCid}`,
  });
  console.log("Modify Payload:", modifyPayload);

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

    if (!response.ok) throw new Error("AI analysis failed.");

    const aiResult = await response.json();
    setMealAnalysis(aiResult); // Use the result from backend
    setStep(2);
  } catch (err: any) {
    setError(`AI analysis failed. ${err.message || "Unknown error"}`);
  } finally {
    setUploading(false);
  }
};

  // Step 2: Confirm & Update backend
  const handleUpdate = async () => {
    if (!secret) {
      setError("Please enter your XRPL Secret.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Simulate backend update and getting grown image
      // Replace with your actual backend call
      await new Promise((res) => setTimeout(res, 1200));
      setGrowImage("https://placehold.co/200x200/fire.png?text=Grown!"); 
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
                className="w-40 h-40 object-cover rounded mb-3 border-2 border-yellow-300"
              />
            )}
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
            <div>Detected Menu: {mealAnalysis.menu}</div>
            <div>Total Estimated Calories: {mealAnalysis.calories} kcal</div>
            {selectedFile && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-40 h-40 object-cover rounded mb-3 border-2 border-yellow-300"
              />
            )}
            <div className="mb-2">Energy: {mealAnalysis.energy}</div>
            <div className="mb-2">Energy Type: {mealAnalysis.energyType}</div>
            <input
              type="text"
              className="mb-2 border rounded px-2 py-1 w-full"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Your XRPL Secret (on Devnet)"
              disabled={uploading}
            />
            <Button
              onClick={handleUpdate}
              disabled={uploading || !secret}
              className="mb-2"
            >
              {uploading ? "パックエンドで処理中..." : "Update"}
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