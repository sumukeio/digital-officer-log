import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. 引入 Toaster 组件
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "数字官工作台",
  manifest: "/manifest.json",
  description: "工厂数字化每日记录系统",
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 禁止缩放，像App一样
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        {/* 2. 将 Toaster 放在这里，通常在 children 下方 */}
        <Toaster />
      </body>
    </html>
  );
}