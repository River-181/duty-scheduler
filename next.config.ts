import type { NextConfig } from "next";

// 정적 export: localStorage 전용 앱이므로 서버 없이 어디에나(GitHub Pages, Vercel,
// S3 등) 배포 가능. GitHub Pages 프로젝트 사이트는 /<repo>/ 하위에서 서비스되므로
// 빌드 시 NEXT_PUBLIC_BASE_PATH 로 basePath 를 주입한다(예: "/random-duty").
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
