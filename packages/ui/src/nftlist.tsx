import React from "react";

export interface NFTItem {
  id: string;
  name: string;
  image: string;
  detailsUrl: string;
  onMealTime?: () => void;
  onMemory?: () => void;
}

interface NFTListProps {
  nfts: NFTItem[];
}

export const NFTList: React.FC<NFTListProps> = ({ nfts }) => (
  <div className="flex flex-wrap gap-6">
    {nfts.map(nft => (
  <div
    key={nft.id}
    className="bg-yellow-100 rounded-xl shadow p-4 flex flex-col items-center w-64"
  >
    {nft.image ? (
      <img
        src={nft.image}
        alt={nft.name}
        className="w-40 h-40 object-cover rounded-lg mb-2 border-2 border-yellow-300"
      />
    ) : (
      <div className="w-40 h-40 flex items-center justify-center bg-yellow-200 rounded-lg mb-2 border-2 border-yellow-300 text-gray-400">
        No Image
      </div>
    )}
    <div className="font-bold text-lg mb-1 max-w-xs h-7 flex items-center justify-center w-full text-center truncate overflow-hidden"
    style={{ maxWidth: 256, minWidth: 256 }}>
  {nft.name}
</div>
    <a
      href={nft.detailsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 underline text-sm mb-3 flex items-center gap-1"
    >
      NFT details
    </a>
    <button
      className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-1 px-4 rounded-lg mb-2 w-full"
      onClick={nft.onMealTime}
    >
      Meal Time
    </button>
    <button
      className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-1 px-4 rounded-lg mb-2 w-full"
      onClick={nft.onMemory}
    >
      Memory
    </button>
  </div>
))}
  </div>
);

export default NFTList;