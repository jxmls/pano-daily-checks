import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/context/toast";

export const metadata: Metadata = {
  title: "Panoptics Infrastructure Hub",
  description: "Daily checks and infrastructure management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
