"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  return (
    <ToastContext.Provider value={flash}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pl-rise"
          style={{
            position: "fixed",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#3A2611",
            color: "#FDF9EE",
            padding: "15px 24px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 60,
            boxShadow: "0 10px 30px rgba(58,38,17,.3)",
          }}
        >
          {toast}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
