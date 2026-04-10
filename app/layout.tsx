import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "늑구맵 - 대전 오월드 탈출 늑대 추적",
  description:
    "2026년 4월 8일 대전 오월드에서 탈출한 늑대 '늑구'의 이동 경로 추적 및 예측 시스템",
  openGraph: {
    title: "늑구맵",
    description: "대전 오월드 탈출 늑대 실시간 추적",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a26",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${spaceMono.variable} h-full`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
