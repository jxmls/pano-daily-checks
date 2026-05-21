"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Variant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
}

interface ToastContextValue {
  toast: (message: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; color: string }> = {
  success: { bg: "#0d3d2e", border: "rgba(16,185,129,0.3)", color: "#6ee7b7" },
  error:   { bg: "#3d0d0d", border: "rgba(239,68,68,0.3)",  color: "#fca5a5" },
  info:    { bg: "#0d2e3d", border: "rgba(0,130,130,0.35)", color: "#5ccfcf" },
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, variant: Variant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => dismiss(id), 4500);
    timers.current.set(id, timer);
  }, [dismiss]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && createPortal(
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => {
            const s = VARIANT_STYLES[t.variant];
            return (
              <div
                key={t.id}
                className="toast-slide"
                style={{
                  pointerEvents: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 280,
                  maxWidth: 380,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: s.bg,
                  border: `1.5px solid ${s.border}`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                  color: s.color,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ flex: 1 }}>{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: s.color,
                    opacity: 0.7,
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                  aria-label="Dismiss"
                >
                  <XMarkIcon style={{ width: 16, height: 16 }} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
