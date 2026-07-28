import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: () => null,
}));

import { SearchResults } from "@/components/search-results";
import type { StaticPerfume } from "@/data/perfumes";

const perfumes: StaticPerfume[] = [
  {
    name: "Sauvage",
    slug: "dior-sauvage",
    brand: "Dior",
    description: null,
    gender: "male",
    concentration: "edp",
    family: "fresh",
    price: null,
    currency: null,
    image_url: null,
    notes: [{ name: "Bergamot", layer: "top" }],
  },
];

describe("SearchResults", () => {
  it("renders the empty state when no perfumes match", () => {
    render(
      <SearchResults
        query="xyzzy"
        perfumes={[]}
        locale="en"
        emptyText='No results for "xyzzy"'
      />,
    );
    expect(screen.getByText(/No results for "xyzzy"/)).toBeInTheDocument();
  });

  it("renders perfume cards when results exist", () => {
    render(
      <SearchResults
        query="sauvage"
        perfumes={perfumes}
        locale="en"
        emptyText="No results"
      />,
    );
    expect(screen.getByText("Sauvage")).toBeInTheDocument();
    expect(screen.getByText("Dior")).toBeInTheDocument();
  });

  it("does not render the empty text when results exist", () => {
    render(
      <SearchResults
        query="sauvage"
        perfumes={perfumes}
        locale="en"
        emptyText="No results"
      />,
    );
    expect(screen.queryByText(/No results/)).not.toBeInTheDocument();
  });
});
