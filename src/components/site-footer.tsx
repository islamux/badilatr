import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:text-start">
        <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        <p className="text-sm text-muted-foreground">{t("rights", { year })}</p>
      </div>
    </footer>
  );
}
