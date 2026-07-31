import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Badil Atr — بديل عطر",
    short_name: "Badil Atr",
    description:
      "A premium Arabic-first perfume discovery platform. Find the closest alternative to your favorite fragrance.",
    start_url: "/",
    display: "standalone",
    background_color: "#120e0a",
    theme_color: "#c79a3f",
    lang: "ar",
    dir: "rtl",
    icons: [],
  };
}
