import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges plain class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts (later wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("resolves color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays", () => {
    expect(cn(["px-2", "py-1"], "mx-auto")).toBe("px-2 py-1 mx-auto");
  });

  it("handles objects (clsx syntax)", () => {
    expect(cn({ active: true, disabled: false }, "extra")).toBe(
      "active extra"
    );
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
