import { Button } from "@repo/ui/button";

export function HomePage() {



  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <div className="bg-yellow-100 p-8  rounded-xl shadow-lg w-full max-w-5xl h-full flex flex-col items-center gap-8">
        <h1 className="text-xl font-bold text-center">
          Get Your Profile NFT!
        </h1>
        <Button 
          className="self-center px-8 py-2 bg-yellow-400 text-white text-lg font-semibold rounded-full shadow-md hover:bg-yellow-500 transition duration-200"
          onClick={() => {
            console.log("Mint NFT clicked!");
          }}
        >
          Mint NFT
        </Button>
      </div>
    </div>
  );
}