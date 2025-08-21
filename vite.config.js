import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // 자동 업데이트 할것인지, 서버에 새로운게 들어오면 자동으로 가져올것인지
      devOptions: {
        enabled: true,
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"], // 캐싱할 파일 목록
      },

      includeAssets: ["*.png", "data/*"], // public 폴더안에 있는 것
      manifest: {
        // manifest.json 파일 생성하는 곳
        name: "테스트용 리액트앱",
        short_name: "MyApp",
        description: "설명",
        theme_color: "#000000",
        display: "standalone", // 상단 주소창을 없애줌, 기본으로 설정되어있음
        icons: [
          {
            src: "logo1.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo2.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
