import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";

export async function SiteHeader() {
  const t = await getTranslations("Nav");

  const navItems = [
    { href: "/", label: "home" },
    { href: "/perfumes", label: "perfumes" },
    { href: "/brands", label: "brands" },
    { href: "/search", label: "search" },
  ] as const;

  const mobileItems = navItems.map((item) => ({
    href: item.href,
    label: t(item.label),
  }));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <MobileNav items={mobileItems} switchLabel={t("menu")} />
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Sparkles className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight">
                بديل عطر
              </span>
              <span className="text-xs text-muted-foreground">Badil Atr</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
