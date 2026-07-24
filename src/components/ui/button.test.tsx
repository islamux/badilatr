import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass(
      ...buttonVariants({ variant: "default", size: "default" }).split(" ")
    );
  });

  it.each([
    ["destructive"],
    ["outline"],
    ["secondary"],
    ["ghost"],
    ["link"],
  ] as const)("renders %s variant with correct classes", (variant) => {
    render(<Button variant={variant}>Text</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("inline-flex");
  });

  it.each(["sm", "lg", "icon"] as const)(
    "renders %s size",
    (size) => {
      render(<Button size={size}>Text</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    }
  );

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click
      </Button>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards asChild to render a child anchor", () => {
    render(
      <Button asChild>
        <a href="/perfumes">Link button</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Link button" });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
  });

  it("passes through data-testid and aria-label", () => {
    render(
      <Button data-testid="submit-btn" aria-label="Submit form">
        Go
      </Button>
    );
    expect(screen.getByTestId("submit-btn")).toHaveAttribute(
      "aria-label",
      "Submit form"
    );
  });
});
