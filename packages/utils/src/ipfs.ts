import { PinataSDK } from "pinata";
import type { PinataConfig } from "pinata";

/**
 * Uploads Json data to IPFS using Pinata.
 * @param {Object} jsonData - The JSON data to upload.
 * @param {string} pinataJwt - The JWT token for Pinata authentication.
 * @returns {Promise<string>} - The IPFS CID of the uploaded JSON data.
 * @throws {Error} - If the upload fails or no JSON data is provided.
 */
export async function uploadJsonToIpfs(jsonData: object, pinataJwt: string): Promise<string> {
    const pinataConfig: PinataConfig = {
        pinataJwt: pinataJwt
    };
    const pinata = new PinataSDK(pinataConfig);
    if (!jsonData) {
        throw new Error("No JSON data provided for upload.");
    }
    try {
        const response = await pinata.upload.public.json(jsonData);
        return `${response.cid}`;
    }
    catch (error: any) {
        console.error("Error uploading JSON to IPFS:", error);
        if (error?.response) {
            try {
                const errData = await error.response.json?.();
                console.error("Pinata error response:", errData);
            } catch (e) {
                console.error("Could not parse Pinata error response.");
            }
        }
        throw new Error("Failed to upload JSON to IPFS.");
    }
}

/**
 * Uploads a file to IPFS using Pinata.
 * @param {File} file - The file to upload.
 * @param {string} pinataJwt - The JWT token for Pinata authentication.
 * @returns {Promise<string>} - The IPFS CID of the uploaded file.
 * @throws {Error} - If the upload fails or no file is provided.
 */
export async function uploadToIpfs(file: File, pinataJwt:string): Promise<string> {
    const pinataConfig: PinataConfig = {
        pinataJwt: pinataJwt
    };
    const pinata = new PinataSDK(pinataConfig);
    if (!file) {
        throw new Error("No file provided for upload.");
    }
    try{
        const response = await pinata.upload.public.file(file)
        console.log("File uploaded to IPFS:", response);

        return `${response.cid}`;
    }
    catch (error: any) {
    console.error("Error uploading file to IPFS:", error);
    if (error?.response) {
        try {
            const errData = await error.response.json?.();
            console.error("Pinata error response:", errData);
        } catch (e) {
            console.error("Could not parse Pinata error response.");
        }
    }
    throw new Error("Failed to upload file to IPFS.");
}
}

/**
 * Retrieves a public gateway URL for a given IPFS CID using Pinata.
 * @param {string} cid - The IPFS CID to convert to a gateway URL.
 * @param {string} pinataJwt - The JWT token for Pinata authentication.
 * @returns {Promise<string>} - The public gateway URL for the given CID.
 * @throws {Error} - If the retrieval fails or no CID is provided.
 */
export async function getUrl(cid: string, pinataJwt: string): Promise<string> {
    const pinataConfig: PinataConfig = {
        pinataJwt: pinataJwt
    };
    const pinata = new PinataSDK(pinataConfig);
    if (!cid) {
        throw new Error("No CID provided.");
    }
    if (!cid || typeof cid !== "string" || cid.trim() === "") {
        throw new Error("No CID provided.");
    }
    try {
        console.log("Retrieving IPFS URL for CID:", cid);
        const response = await pinata.gateways.public.convert(cid);
        console.log("Retrieved IPFS URL:", response);
        if (!response) {
            throw new Error("Failed to retrieve URL from IPFS.");
        }
        return response;
    }
    catch (error: any) {
        console.error("Error retrieve URL from IPFS:", error);
        if (error?.response) {
            try {
                const errData = await error.response.json?.();
                console.error("Pinata error response:", errData);
            } catch (e) {
                console.error("Could not parse Pinata error response.");
            }
        }
        throw new Error("Failed to retrieve URL from IPFS.");
    }
}