import { useCallback, useEffect, useState } from "react";
import { getWallet } from "@/lib/server-fns";
import { clearSession, ensureDeviceKey, getSession, getOwnerKey, setSession } from "@/lib/wallet";

// Shared account/wallet state for the creator & shop surfaces.
export function useAccount() {
  const [ownerKey, setOwnerKey] = useState("");
  const [session, setSessionState] = useState(null);
  const [wallet, setWallet] = useState(null);

  const refreshWallet = useCallback(async (key) => {
    const k = key || getOwnerKey();
    if (!k) return null;
    try {
      const s = getSession();
      const w = await getWallet({ data: { owner_key: k, token: s?.token } });
      setWallet(w);
      return w;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const k = getOwnerKey();
    setOwnerKey(k);
    setSessionState(getSession());
    refreshWallet(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogout = () => {
    clearSession();
    setSessionState(null);
    const k = `dev:${ensureDeviceKey()}`;
    setOwnerKey(k);
    refreshWallet(k);
  };

  return { ownerKey, session, wallet, refreshWallet, logout: doLogout };
}