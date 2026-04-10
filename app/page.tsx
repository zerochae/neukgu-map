"use client";

import dynamic from "next/dynamic";

const NeukguMap = dynamic(() => import("./components/NeukguMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="text-2xl font-bold text-o mb-2">늑구맵</div>
        <div className="text-sm text-comment">지도 로딩 중...</div>
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <main className="h-full w-full relative">
      <NeukguMap />
    </main>
  );
}
