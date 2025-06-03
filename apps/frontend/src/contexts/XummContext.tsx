import { createContext, useContext } from "react";
import { Xumm } from "xumm";

export const XummContext = createContext<{ xumm: Xumm; isLoggedIn: boolean }>({
  xumm: null as any,
  isLoggedIn: false,
});

export const useXumm = () => useContext(XummContext);
