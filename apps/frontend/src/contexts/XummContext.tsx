import { createContext, useContext } from "react";
import { Xumm } from "xumm";

export type NftListItem = {
  NFTokenID: string;
  URI: string;
};

export const XummContext = createContext<{
  xumm: Xumm;
  isLoggedIn: boolean;
  nftList: { avatars: NftListItem[]; pets: NftListItem[] } | {};
  fetchNftList: (account: string) => void;
}>({
  xumm: null as any,
  isLoggedIn: false,
  nftList: { avatars: [], pets: [] },
  fetchNftList: () => {},
});

export const useXumm = () => useContext(XummContext);
