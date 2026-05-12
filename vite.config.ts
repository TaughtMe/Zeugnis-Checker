import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "prompt",
            includeAssets: ["icons/favicon-32.png", "icons/icon-128.png"],
            manifest: {
                name: "KI Zeugnis Checker",
                short_name: "Zeugnis-Checker",
                description: "Lokaler KI-gestützter Zeugnis-Checker. Verarbeitet Daten ausschließlich lokal über LM Studio.",
                lang: "de",
                start_url: "/",
                display: "standalone",
                background_color: "#020617",
                theme_color: "#020617",
                icons: [
                    { src: "icons/icon-128.png", sizes: "128x128", type: "image/png" },
                    { src: "icons/icon-256.png", sizes: "256x256", type: "image/png" },
                    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
                    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
                ]
            },
            workbox: {
                // Cache app shell for offline use. LM Studio API calls are
                // explicitly NOT cached (NetworkOnly), so each analysis hits
                // the live local server.
                globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,mjs}"],
                runtimeCaching: [
                    {
                        urlPattern: /^http:\/\/(localhost|127\.0\.0\.1):1234\/.*/,
                        handler: "NetworkOnly"
                    }
                ],
                navigateFallback: "/index.html"
            }
        })
    ],
    server: {
        port: 5173,
        strictPort: false
    },
    build: {
        target: "es2020",
        sourcemap: false
    }
});
