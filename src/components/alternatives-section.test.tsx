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

import { AlternativesSection } from "@/components/alternatives-section";
import type { Alternative } from "@/types/catalog";

const alternatives: Alternative[] = [
  {
    slug: "afnan-example",
    name: "Afnan Example",
    image: null,
    brand: { name: "Afnan", slug: "afnan" },
    score: 82,
    sharedNotes: [
      { name: "Bergamot", sameLayer: true },
      { name: "Amber", sameLayer: false },
    ],
  },
];

describe("AlternativesSection", () => {
  it("renders nothing when alternatives list is empty", () => {
    const { container } = render(
      <AlternativesSection alternatives={[]} locale="en" heading="Alternatives" sharedLabel="Shared notes" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the heading and alternative cards", () => {
    render(
      <AlternativesSection alternatives={alternatives} locale="en" heading="Alternatives" sharedLabel="Shared notes" />,
    );
    expect(screen.getByText("Alternatives")).toBeInTheDocument();
    expect(screen.getByText("Afnan Example")).toBeInTheDocument();
    expect(screen.getByText("Afnan")).toBeInTheDocument();
  });

  it("shows the similarity score", () => {
    render(
      <AlternativesSection alternatives={alternatives} locale="en" heading="Alternatives" sharedLabel="Shared notes" />,
    );
    expect(screen.getByText("82%")).toBeInTheDocument();
  });

  it("lists shared note names", () => {
    render(
      <AlternativesSection alternatives={alternatives} locale="en" heading="Alternatives" sharedLabel="Shared notes" />,
    );
    expect(screen.getByText(/Bergamot/)).toBeInTheDocument();
    expect(screen.getByText(/Amber/)).toBeInTheDocument();
  });

  it("links to the alternative perfume page", () => {
    render(
      <AlternativesSection alternatives={alternatives} locale="en" heading="Alternatives" sharedLabel="Shared notes" />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/en/perfumes/afnan-example");
  });
});
