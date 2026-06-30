import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "藏汉英互译在线网页",
  description: "支持藏文、中文、英文互译与朗读的在线翻译工具。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
