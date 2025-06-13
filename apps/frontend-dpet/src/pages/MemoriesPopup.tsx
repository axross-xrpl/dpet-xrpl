import { useState, useEffect, memo } from "react";
// import { Input } from "@repo/ui/input"; // Not used in this example
// import { Button } from "@repo/ui/button";
import { Popup } from "@repo/ui/popup";

// Define the structure of the JSON data
interface IpfsMemoryData {
    pet_name: string;
    image: string; // Direct image URL or IPFS hash
    date: string;
    type: string; // "pet"
    pet_type: string;
    generations: string;
    food_name?: string;
    food_image?: string; // Direct image URL or IPFS hash
    meal_date?: string;
    Impressions?: string;
}

// Define the structure for local memory state
interface Memory {
    date: string;
    image: string;
    pet_name: string;
    pet_type: string;
    generations: string;
    food_name?: string;
    food_image?: string;
    meal_date?: string;
    Impressions?: string;
}

// Define the structure of the data will pass in
interface ModifyListDataItem {
    NFTokenID: string;
    URIs: string[];
}

interface MemoriesPopupProps {
    // NFTokenID is still useful for the title or if decide to filter by it later
    NFTokenID: string;
    // This prop will hold the data fetched elsewhere
    modifyListData: ModifyListDataItem[] | null;
    open: boolean; // Control opening from parent
    onClose: () => void; // Control closing from parent
}

// Helper to convert IPFS URI to a gateway URL
const ipfsGatewayUrl = (ipfsUri: string) => {
    if (ipfsUri && ipfsUri.startsWith("ipfs://")) {
        return `https://gateway.pinata.cloud/ipfs/${ipfsUri.substring(7)}`;
    }
    return ipfsUri; // Return as is if not a standard IPFS URI
};

const MemoriesPopupComponent: React.FC<MemoriesPopupProps> = ({ NFTokenID, modifyListData, open, onClose }) => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    console.log("MemoriesPopup rendered with NFTokenID:", NFTokenID, "modifyListData:", modifyListData);

    useEffect(() => {
        if (!open || !modifyListData || !NFTokenID) {
            setMemories([]);
            if (open && !isLoading && (!modifyListData || !NFTokenID)) {
                // setError("Required data (modifyListData or NFTokenID) not provided.");
            }
            return;
        }

        const processIpfsData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (!Array.isArray(modifyListData) || modifyListData.length === 0) {
                    setMemories([]);
                    setIsLoading(false);
                    return;
                }

                // Find the specific token entry in modifyListData that matches the NFTokenID prop
                const currentTokenEntry = modifyListData.find(entry => entry.NFTokenID === NFTokenID);

                if (!currentTokenEntry || !currentTokenEntry.URIs || currentTokenEntry.URIs.length === 0) {
                    // No URIs found for the specified NFTokenID in the provided list
                    setMemories([]);
                    setIsLoading(false);
                    // setError(`No URIs found for NFTokenID: ${NFTokenID.substring(0,10)}...`);
                    return;
                }

                const fetchedMemories: Memory[] = [];

                // Process only the URIs for the currentTokenEntry
                for (const uri of currentTokenEntry.URIs) {
                    const jsonUrl = ipfsGatewayUrl(uri);
                    try {
                        const ipfsResponse = await fetch(jsonUrl);
                        if (!ipfsResponse.ok) {
                            console.warn(`Failed to fetch IPFS data from ${jsonUrl}: ${ipfsResponse.statusText}`);
                            continue;
                        }
                        const ipfsData: IpfsMemoryData = await ipfsResponse.json();

                        fetchedMemories.push({
                            date: ipfsData.date,
                            image: ipfsGatewayUrl(ipfsData.image),
                            pet_name: ipfsData.pet_name,
                            pet_type: ipfsData.pet_type,
                            generations: ipfsData.generations,
                            food_name: ipfsData.food_name,
                            food_image: ipfsData.food_image ? ipfsGatewayUrl(ipfsData.food_image) : undefined,
                            meal_date: ipfsData.meal_date,
                            Impressions: ipfsData.Impressions,
                        });
                    } catch (ipfsError) {
                        console.warn(`Error processing IPFS URI ${jsonUrl}:`, ipfsError);
                    }
                }

                setMemories(fetchedMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.error("Failed to load memories:", errorMessage);
                setError(errorMessage);
                setMemories([]);
            } finally {
                setIsLoading(false);
            }
        };

        processIpfsData();
    }, [open, modifyListData, NFTokenID]); // Add NFTokenID to dependency array

    return (
        <Popup
            open={open} // Controlled by parent
            title={
                <span className="text-start text-2xl font-bold text-yellow-600">
                    <span className="text-yellow-800">🐾</span>
                    Memories
                </span>
            }
            onClose={onClose} // Controlled by parent
        >
            <div className="rounded-xl p-8 max-h-[70vh] overflow-y-auto bg-[#fffbe8]">
                {isLoading && <p className="text-center">Loading memories...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}
                {!isLoading && !error && memories.length === 0 && (
                    <p className="text-center">No memories found for this token.</p>
                )}
                {!isLoading && !error && memories.map((memory, idx) => (
                    <div key={idx} className="mb-8 last:mb-0">
                        {idx === 0 && (
                            <>
                                {/* <div className="font-bold text-xl mb-2 text-left">{memory.date}</div> */}
                                <img
                                    src={memory.image}
                                    alt={memory.pet_name}
                                    className="w-48 h-48 object-cover rounded-xl mx-auto mb-2"
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/192x192?text=Image+Error')}
                                />
                                <div className="py-2 text-center font-semibold">{memory.pet_name}</div>
                                {/* <div className="text-center text-sm text-gray-700 mb-2">
                                    {memory.pet_type} / {memory.generations}
                                </div> */}
                                <hr className="my-6 border-t-8 border-yellow-400" />
                            </>
                        )}
                        {memory.food_name && (
                            <div className="mt-4">
                                <div className="font-semibold text-left">{memory.meal_date}</div>
                                {memory.food_image && (
                                    <img
                                        src={memory.food_image}
                                        alt={memory.food_name}
                                        className="w-48 object-cover rounded-lg mx-auto my-2"
                                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/128x128?text=Food+Img+Error')}
                                    />
                                )}
                                <div className="text-left font-semibold mb-1">{memory.food_name}</div>
                                <div className="text-center text-sm text-gray-700 mb-2">{memory.Impressions}</div>
                            </div>
                        )}
                        {idx !== memories.length-1 && (
                            <hr className="my-6 border-t-8 border-yellow-400" />
                        )}
                    </div>
                ))}
            </div>
        </Popup>
    );
}

export const MemoriesPopup = memo(MemoriesPopupComponent, (prevProps, nextProps) => {
    // Only re-render if open state or NFTokenID changes
    return prevProps.open === nextProps.open && prevProps.NFTokenID === nextProps.NFTokenID;
});