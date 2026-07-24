import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies gold variant classes", () => {
    render(<Badge variant="gold">Premium</Badge>);
    const badge = screen.getByText("Premium");
    expect(badge.className).toContain("bg-gold");
  });

  it("applies outline variant classes", () => {
    render(<Badge variant="outline">Outlined</Badge>);
    const badge = screen.getByText("Outlined");
    expect(badge.className).toContain("border");
  });
});

describe("Card", () => {
  it("renders all compound components with children", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("applies base card classes", () => {
    render(<Card data-testid="card">Body</Card>);
    expect(screen.getByTestId("card").className).toContain("rounded-xl");
  });
});

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("fires onChange when typed in", async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} placeholder="Search" />);
    await userEvent.type(screen.getByPlaceholderText("Search"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("forwards type attribute", () => {
    render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute(
      "type",
      "email"
    );
  });
});

describe("Skeleton", () => {
  it("renders with animate-pulse class", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").className).toContain(
      "animate-pulse"
    );
  });
});

describe("Separator", () => {
  it("renders horizontal by default", () => {
    render(<Separator data-testid="sep" />);
    const sep = screen.getByTestId("sep");
    expect(sep.className).toContain("h-px");
    expect(sep.className).toContain("w-full");
  });

  it("renders vertical when orientation set", () => {
    render(<Separator orientation="vertical" data-testid="sep" />);
    const sep = screen.getByTestId("sep");
    expect(sep.className).toContain("h-full");
    expect(sep.className).toContain("w-px");
  });

  it("sets role none when decorative", () => {
    render(<Separator decorative data-testid="sep" />);
    expect(screen.getByTestId("sep")).toHaveAttribute("role", "none");
  });

  it("sets role separator when not decorative", () => {
    render(<Separator decorative={false} data-testid="sep" />);
    expect(screen.getByTestId("sep")).toHaveAttribute("role", "separator");
  });
});
