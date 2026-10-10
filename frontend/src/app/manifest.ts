import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kaizu — Continuous Improvement OS",
    short_name: "Kaizu",
    description: "Continuous Improvement Operating System. Plan, Do, Reflect, and Improve.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F4EFE3",
    theme_color: "#244633",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    categories: ["productivity", "education", "lifestyle"],
  };
}
