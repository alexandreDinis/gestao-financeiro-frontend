"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextValue {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  privacyMode: false,
  togglePrivacyMode: () => {},
});

const STORAGE_KEY = "gf_privacy_mode";

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setPrivacyMode(true);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
