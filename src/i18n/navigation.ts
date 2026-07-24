import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Always use these instead of
 * `next/link`, `next/navigation`, etc. so the active locale prefix is kept.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
