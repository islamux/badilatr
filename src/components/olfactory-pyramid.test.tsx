import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OlfactoryPyramid } from "@/components/olfactory-pyramid";
import type { CatalogNote } from "@/types/catalog";

const notes: CatalogNote[] = [
  { name: "Bergamot", layer: "top" },
  { name: "Rose", layer: "heart" },
  { name: "Vanilla", layer: "base" },
];

describe("OlfactoryPyramid", () => {
  it("renders three layer sections", () => {
    render(<OlfactoryPyramid notes={notes} locale="en" />);
    expect(screen.getByText(/Top/)).toBeInTheDocument();
    expect(screen.getByText(/Heart/)).toBeInTheDocument();
    expect(screen.getByText(/Base/)).toBeInTheDocument();
  });

  it("renders note names grouped under their layers", () => {
    render(<OlfactoryPyramid notes={notes} locale="en" />);
    expect(screen.getByText("Bergamot")).toBeInTheDocument();
    expect(screen.getByText("Rose")).toBeInTheDocument();
    expect(screen.getByText("Vanilla")).toBeInTheDocument();
  });

  it("renders Arabic labels for ar locale", () => {
    render(<OlfactoryPyramid notes={notes} locale="ar" />);
    expect(screen.getByText(/علوية/)).toBeInTheDocument();
    expect(screen.getByText(/وسطى/)).toBeInTheDocument();
    expect(screen.getByText(/قاعدية/)).toBeInTheDocument();
  });

  it("omits a layer section when it has no notes", () => {
    render(
      <OlfactoryPyramid
        notes={[{ name: "Vanilla", layer: "base" }]}
        locale="en"
      />,
    );
    expect(screen.queryByText(/Top/)).not.toBeInTheDocument();
    expect(screen.getByText("Vanilla")).toBeInTheDocument();
  });
});
