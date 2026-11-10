import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoPrice — Avtomobil narxini baholash",
  description: "O'zbekistonda ishlatilgan avtomobillar uchun taxminiy bozor narxini hisoblash.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz"><body>{children}</body></html>;
}
