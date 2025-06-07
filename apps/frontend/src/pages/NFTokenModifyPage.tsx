import { useState } from "react";
import { useXumm } from "../contexts/XummContext";
import { createNFTokenModifyPayload } from "@repo/utils/nftokenModify";

// Example NFT data (replace with real fetch logic)
const sampleNFT = {
    Account: "rnrqYeC3MfcowDJo7hB1tD9PwKRFHjp5HY",
    NFTokenID: "001800002C0906EB245FC56B8B2C7BDB5A130B05CFDCE2E019D5177E0032BAE3",
    URI: "ipfs://QmZKiuJT9NSJE35qkLnwoHad9JDNTHvWNP7vQWmEEefwcu",
};

export function NFTokenModifyPage() {
    const { xumm } = useXumm();
    const [uri, setUri] = useState(sampleNFT.URI ?? "");
    const [confirmed, setConfirmed] = useState(false);
    const [payload, setPayload] = useState<any>(null);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<any>(null);

    function stringToHex(str: string) {
        return Array.from(str)
            .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
    }

    const handleConfirm = () => {
        const txPayload = createNFTokenModifyPayload({
            Account: sampleNFT.Account,
            NFTokenID: sampleNFT.NFTokenID,
            URI: stringToHex(uri),
        });
        setPayload(txPayload);
        setConfirmed(true);
        setSendResult(null);
    };

    const handleSentPayloads = async (payload: any) => {
        setSending(true);
        setSendResult(null);
        try {
            if (!payload) {
                console.error("No payloads sent");
                setSendResult("No payload to send.");
                setSending(false);
                return;
            }
            if (!xumm?.payload) {
                console.error("xumm.payload is undefined");
                setSendResult("Xumm payload API not available.");
                setSending(false);
                return;
            }
            const response = await xumm.payload.create(payload);
            if (!response) {
                console.error("Failed to create payload");
                setSendResult("Failed to create payload.");
                setSending(false);
                return;
            }
            setSendResult(response);
            console.log("Payload created successfully:", response);
        } catch (err) {
            setSendResult("Error sending payload.");
            console.error(err);
        }
        setSending(false);
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Modify NFT</h2>
            <div className="mb-4">
                <div>
                    <strong>NFT ID:</strong> <span className="break-all">{sampleNFT.NFTokenID}</span>
                </div>
                <div>
                    <strong>Current URI:</strong> <span className="break-all">{sampleNFT.URI}</span>
                </div>
            </div>
            <div className="mb-4">
                <label className="block font-semibold mb-1">New URI</label>
                <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={uri}
                    onChange={e => setUri(e.target.value)}
                />
            </div>
            <button
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                onClick={handleConfirm}
            >
                Confirm Changes
            </button>

            {confirmed && payload && (
                <div className="mt-6 p-4 bg-yellow-50 border rounded">
                    <h3 className="font-semibold mb-2">Payload Ready</h3>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(payload, null, 2)}
                    </pre>
                    <button
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => handleSentPayloads(payload)}
                        disabled={sending}
                    >
                        {sending ? "Sending..." : "Send to Xumm"}
                    </button>
                    {sendResult && (
                        <div className="mt-4 text-sm">
                            <strong>Result:</strong>
                            <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{typeof sendResult === "string" ? sendResult : JSON.stringify(sendResult, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}