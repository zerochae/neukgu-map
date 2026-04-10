import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://neukgu-map.pages.dev"),
  title: "늑구맵 - 대전 오월드 탈출 늑대 추적",
  description:
    "2026년 4월 8일 대전 오월드에서 탈출한 늑대 '늑구'의 이동 경로 추적 및 예측 시스템",
  openGraph: {
    title: "늑구맵",
    description: "대전 오월드 탈출 늑대 '늑구' 이동 경로 추적 및 위치 예측",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 900,
        alt: "대전 오월드 탈출 늑대 늑구",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "늑구맵",
    description: "대전 오월드 탈출 늑대 '늑구' 이동 경로 추적 및 위치 예측",
    images: ["/og.jpg"],
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
