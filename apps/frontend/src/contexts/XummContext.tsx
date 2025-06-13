import { createContext, useContext } from "react";
import { Xumm } from "xumm";

export const XummContext = createContext<{
  xumm: Xumm;
  isLoggedIn: boolean;
  nftList: { avatars: object[]; pets: object[] } | {};
}>({
  xumm: null as any,
  isLoggedIn: false,
  nftList: { avatars: [], pets: [] },
});

export const useXumm = () => useContext(XummContext);
