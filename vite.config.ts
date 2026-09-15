import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pagesはプロジェクトのサブパス (https://<user>.github.io/othellonia-deck-planner/) で
// 配信されるため、base をリポジトリ名に合わせる。ローカル開発時は "/" のままにする。
const base = process.env.GITHUB_PAGES === "true" ? "/othellonia-deck-planner/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/source.svg"],
      manifest: {
        id: "/othellonia-deck-planner/",
        name: "オセロニアデッキ編成プランナー",
        short_name: "デッキプランナー",
        description: "ネット上のデッキ編成案を調べ、所持チェック・代替案・入手方法メモを管理するPWA",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#14141c",
        theme_color: "#2f9e6e",
        orientation: "portrait",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/icons\/.*\.png$/,
            handler: "CacheFirst",
            options: { cacheName: "app-icons-cache" },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
});
