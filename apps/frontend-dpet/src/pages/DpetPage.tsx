import { useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";

export function DpetPage() {
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    </div>
  );
}