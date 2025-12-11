import type { Metadata } from "next";
// 1. 删除这一行：import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// 2. 删除这一行：const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "数字官工作台",
  description: "工厂数字化每日记录系统",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* 3. 移除 className={inter.className}，直接用系统字体 */}
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}