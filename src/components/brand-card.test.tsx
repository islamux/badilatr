import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    locale,
    children,
  }: {
    href: string;
    locale: string;
    children: React.ReactNode;
  }) => <a href={`/${locale}${href}`}>{children}</a>,
}));

import { BrandCard } from "@/components/brand-card";
import type { BrandSummary } from "@/types/catalog";

const brand: BrandSummary = {
  slug: "dior",
  name: "Dior",
  country: "France",
  logo: null,
  type: "designer",
  perfumeCount: 2,
};

describe("BrandCard", () => {
  it("renders brand name and country", () => {
    render(<BrandCard brand={brand} locale="en" />);
    expect(screen.getByText("Dior")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
  });

  it("links to the brand page via locale-aware Link", () => {
    render(<BrandCard brand={brand} locale="en" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/en/brands/dior");
  });

  it("shows perfume count for en locale", () => {
    render(<BrandCard brand={brand} locale="en" />);
    expect(screen.getByText(/2 perfumes/)).toBeInTheDocument();
  });

  it("shows Arabic count for ar locale", () => {
    render(<BrandCard brand={brand} locale="ar" />);
    expect(screen.getByText(/2 عطر/)).toBeInTheDocument();
  });
});
