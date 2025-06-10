import { useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import { Popup } from "@repo/ui/popup";
import img from "../../../frontend/src/assets/avatars/avatar-a001.jpg";

const memories = [
  // type: "pet" (initial)
  {
    pet_name: "ぼち",
    image: img,
    date: "2025/04/22",
    type: "pet",
    pet_type: "dog001",
    generations: "gen1",
  },
  // type: "pet" (with meal)
  {
    pet_name: "ぼち",
    image: img,
    date: "2025/05/06",
    type: "pet",
    pet_type: "dog002",
    generations: "gen2",
    food_name: "Ramen",
    food_image: "https://gateway.pinata.cloud/ipfs/<食事画像IPFSハッシュ>",
    meal_date: "2025/05/06",
    Impressions: "It was very good ramen! It's my favorite!",
  },
  // ...more memories
];

export function DpetPage() {
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
    setError(null);
    setIpfsUrl(null);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      setError("No file selected for upload.");
      setIpfsUrl(null);
      return;
    }

    setError(null);
    setIpfsUrl(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file to backend");
      }

      const data = await response.json();
      setIpfsUrl(data.ipfsUrl);
    } catch (err: any) {
      setError(err.message || "Error uploading file to IPFS.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>DPet Page (IPFS Upload via Backend)</h2>
      <Input type="file" onChange={handleFileChange} disabled={uploading} />
      <Button onClick={handleUploadClick} disabled={uploading || !selectedFile} className="px-4 py-2 bg-yellow-700 text-white rounded font-semibold hover:bg-yellow-600 transition-colors duration-200 shadow">
        {uploading ? "Uploading..." : "Upload"}
      </Button>
      {ipfsUrl && (
        <div>
          <p>File uploaded to IPFS:</p>
          <a
            href={ipfsUrl.startsWith("ipfs://") ? ipfsUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ipfsUrl}
          </a>
        </div>
      )}
      {error && <div style={{ color: "yellow" }}>{error}</div>}
      <Button onClick={() => setOpen(true)}>Show Popup</Button>
      <Popup
        open={open}
        title="Memory"
        message="ポップアップ画面"
        onClose={() => setOpen(false)}
      >
        <div className="rounded-xl p-4 max-h-[70vh] overflow-y-auto bg-[#fffbe8]">
          {memories.map((memory, idx) => (
            <div key={idx} className="mb-8 last:mb-0">
              <div className="font-bold text-xl mb-2 text-left">{memory.date}</div>
              <img
                src={memory.image}
                alt={memory.pet_name}
                className="w-48 h-48 object-cover rounded-xl mx-auto mb-2"
              />
              <div className="text-center font-semibold">{memory.pet_name}</div>
              <div className="text-center text-sm text-gray-700 mb-2">
                {memory.pet_type} / {memory.generations}
              </div>
              {/* Show meal info if present */}
              {memory.food_name && (
                <div className="mt-4">
                  <div className="font-semibold text-left">{memory.meal_date} - {memory.food_name}</div>
                  <img
                    src={memory.food_image}
                    alt={memory.food_name}
                    className="w-32 h-32 object-cover rounded-lg mx-auto my-2"
                  />
                  <div className="text-center text-sm text-gray-700">{memory.Impressions}</div>
                </div>
              )}
              {idx !== memories.length - 1 && (
                <hr className="my-6 border-t border-yellow-300" />
              )}
            </div>
          ))}
        </div>
      </Popup>
    </div>
  );
}