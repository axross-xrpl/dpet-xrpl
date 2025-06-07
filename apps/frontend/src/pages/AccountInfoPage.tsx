import { useRef, useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";

export function AccountInfo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL!;

  const fetchAccountInfo = async () => {
    const address = inputRef.current?.value?.trim();
    if (!address) return;
    const res = await fetch(`${API_URL}/api/xrpl/account/${address}`);
    const data = await res.json();
    setAccountInfo(data);
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <div className="bg-yellow-100 p-8  rounded-xl shadow-lg w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-yellow-600">XRPL Account Lookup</h1>
        <Input
          ref={inputRef}
          placeholder="Enter XRPL address"
          className="w-full mb-4"
          onKeyDown={e => { if (e.key === "Enter") fetchAccountInfo(); }}
        />
        <Button
          onClick={fetchAccountInfo}
          className="w-full bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition-colors py-2 rounded mb-4"
        >
          Lookup Account
        </Button>
        <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto text-sm min-h-[80px]">
          {accountInfo ? JSON.stringify(accountInfo, null, 2) : "No data yet"}
        </pre>
      </div>
    </div>
  );
}