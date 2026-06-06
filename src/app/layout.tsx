import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "당직 스케줄러",
  description:
    "직원·공휴일·휴가를 관리하고 공평하게 당직표를 자동 생성하는 웹 도구. 데이터는 브라우저에만 저장됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
