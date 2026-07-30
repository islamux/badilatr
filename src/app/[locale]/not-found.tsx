import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-5xl font-semibold text-gold">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-pretty text-muted-foreground">{t("description")}</p>
      <Link href="/" className={buttonVariants({ variant: "default" })}>
        {t("home")}
      </Link>
    </div>
  );
}
