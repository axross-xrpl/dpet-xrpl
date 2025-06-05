import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AccountInfo } from "./pages/AccountInfoPage";
import { XummContext } from "./contexts/XummContext";
import dnftLogo from "./assets/dnft_icon.webp";
import { Button } from "@repo/ui/button";
import { Xumm } from "xumm";

function App() {
  const xummApiKey = import.meta.env.VITE_XUMM_API_KEY!;
  const xumm = useMemo(() => new Xumm(xummApiKey), [xummApiKey]);
  // console.log('✅ XUMM API KEY:', import.meta.env.VITE_XUMM_API_KEY);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
  const checkLoginStatus = async () => {
    try {
      const xummState = xumm.state.signedIn;
      if (xummState) {
        const userAccount =  xumm.state.account;
        setIsLoggedIn(true);
        setAccount(userAccount ?? null);
        await fetchBalance(userAccount);
      }
      else {
        setIsLoggedIn(false);
        setAccount(null);
      }
    } catch (error) {
      console.error("Error checking login status", error);
    }
  };

  checkLoginStatus();
}, [xumm]);

const fetchBalance = async (account: string) => {
  if (!account) return;
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance/${account}`);
    if (!response.ok) {
      throw new Error("Failed to fetch balance");
    }
    const data = await response.json();
    setBalance(data[0].value ?? null);
    setCurrency(data[0].currency ?? null);
  } catch (error) {
    console.error("Error fetching balance", error);
    setBalance(null);
  }
};

  const handleSignIn = async () => {
  if (isLoggedIn) return;
  try {
    await xumm.authorize().then(async (flow) => {
      if (!flow || (flow as any).me?.account === undefined) {
        console.error("Authorization flow not returned or account missing");
        return;
      }
      const account = (flow as any).me.account;
      setIsLoggedIn(true);
      setAccount(account ?? null);
      await fetchBalance(account);
    });
  } catch (error) {
    console.error("Error during sign-in", error);
  }
};

  const handleLogout = async () => {
    if (!isLoggedIn) return;
    try {
      await xumm.logout().finally(() => {
        setAccount(null);
        setIsLoggedIn(false);
        setBalance(null);
        setCurrency(null);
      });
    }
    catch (error) {
      console.error("Error during logout", error);
    }
  };

  return (
    <XummContext.Provider value={{ xumm, isLoggedIn }}>
      {!isLoggedIn ? (
        // Show login page or prompt
        <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 border-8 border-yellow-100">

          <img
            src={dnftLogo}
            alt="Xumm Logo"
            className="w-24 h-24 mb-6 rounded-3xl shadow-lg"
          />
          <Button
            onClick={handleSignIn}
            className="px-6 py-3 bg-yellow-400 text-white rounded font-semibold hover:bg-yellow-700 transition-colors duration-200 shadow"
          >
            Connect Wallet
          </Button>
        </div>
      ) : (
        // Show the rest of your app after login
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <nav className="p-4 bg-yellow-100 flex items-center justify-between shadow-md">
              <div className="flex gap-4">
                <NavLink
                  to="/"
                  end
                >
                  <img
                    src={dnftLogo}
                    alt="dnft Logo"
                    className="w-10 h-10 rounded-3xl"
                  />
                </NavLink>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-4 py-2 rounded transition-colors duration-200 font-semibold ${isActive
                      ? "bg-yellow-700 text-white"
                      : "text-yellow-700 hover:bg-yellow-200"
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/info"
                  end
                  className={({ isActive }) =>
                    `px-4 py-2 rounded transition-colors duration-200 font-semibold ${isActive
                      ? "bg-yellow-700 text-white"
                      : "text-yellow-700 hover:bg-yellow-200"
                    }`
                  }
                >
                  Account Info
                </NavLink>
              </div>

              <div className="flex items-center gap-2">
                <p className="px-4 py-2 text-yellow-700 font-semibold">
                  Balance: {balance} {currency}
                </p>
                <p className="px-4 py-2 text-yellow-700 font-semibold">
                  Address: {account}
                </p>
                <Button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-700 transition-colors duration-200 shadow"
                >
                  Logout
                </Button>
              </div>

            </nav>
            <main className="flex-1 h-full bg-yellow-400 p-4">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/info" element={<AccountInfo />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      )}
    </XummContext.Provider>
  );
}

export default App;
