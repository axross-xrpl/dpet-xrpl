import { convertHexToString } from "xrpl"

export async function fetchIpfsMetadata(hexUri: string) {
  const uri = convertHexToString(hexUri);
  const ipfsHash = uri.replace("ipfs://", "");
  const url = `http://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch IPFS metadata");
  return res.json();
}