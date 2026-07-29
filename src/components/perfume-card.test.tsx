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
vi.mock("next/image", () => ({ default: () => null }));

import { PerfumeCard } from "@/components/perfume-card";
import type { StaticPerfume } from "@/data/perfumes";

const perfume: StaticPerfume = {
  name: "Kiaana Vibes",
  slug: "afnan-kiaana-vibes",
  brand: "Afnan",
  description: null,
  gender: "female",
  concentration: "edp",
  family: "floral",
  price: null,
  currency: null,
  image_url: null,
  notes: [
    { name: "Pitahaya", layer: "top" },
    { name: "Peony", layer: "heart" },
    { name: "Amber", layer: "base" },
  ],
};

describe("PerfumeCard", () => {
  it("renders the perfume name and brand", () => {
    render(<PerfumeCard perfume={perfume} locale="en" />);
    expect(screen.getByText("Kiaana Vibes")).toBeInTheDocument();
    expect(screen.getByText("Afnan")).toBeInTheDocument();
  });

  it("links to the locale-aware perfume detail page", () => {
    render(<PerfumeCard perfume={perfume} locale="en" />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/en/perfumes/afnan-kiaana-vibes",
    );
  });

  it("links with the ar locale prefix", () => {
    render(<PerfumeCard perfume={perfume} locale="ar" />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/ar/perfumes/afnan-kiaana-vibes",
    );
  });

  it("shows the translated family label", () => {
    render(<PerfumeCard perfume={perfume} locale="en" />);
    expect(screen.getByText("Floral")).toBeInTheDocument();
  });

  it("shows note layers for the en locale", () => {
    render(<PerfumeCard perfume={perfume} locale="en" />);
    expect(screen.getByText(/Top:/)).toBeInTheDocument();
    expect(screen.getByText(/Heart:/)).toBeInTheDocument();
    expect(screen.getByText(/Base:/)).toBeInTheDocument();
  });
});
