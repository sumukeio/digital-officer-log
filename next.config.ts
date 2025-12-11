import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 保持之前的 Docker 部署配置
  output: "standalone",

  // 2. 新增：调大 Server Actions 的上传限制
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // 这里设置为 10MB，你可以根据需要改成 '50mb'
    },
  },
};

export default nextConfig;