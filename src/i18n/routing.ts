import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Arabic-first platform: `ar` is the default and primary locale.
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
