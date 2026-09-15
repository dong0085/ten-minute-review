import { describe, expect, it } from "vitest";
import { isIndexOrder, shuffledIndexOrder } from "./option-order";

describe("isIndexOrder", () => {
  it("accepts each index exactly once", () => {
    expect(isIndexOrder([2, 0, 1], 3)).toBe(true);
    expect(isIndexOrder([0, 0, 1], 3)).toBe(false);
    expect(isIndexOrder([0, 1], 3)).toBe(false);
    expect(isIndexOrder([0, 1, 3], 3)).toBe(false);
  });
});

describe("shuffledIndexOrder", () => {
  it("returns a permutation of every option index", () => {
    const values = [0.1, 0.7, 0.2];
    let position = 0;
    const order = shuffledIndexOrder(4, undefined, () => values[position++] ?? 0);

    expect([...order].sort()).toEqual([0, 1, 2, 3]);
  });

  it("cannot repeat the previous order when alternatives exist", () => {
    expect(shuffledIndexOrder(4, [0, 1, 2, 3], () => 0.999)).toEqual([1, 2, 3, 0]);
  });

  it("handles questions with fewer than two options", () => {
    expect(shuffledIndexOrder(0, [], () => 0.5)).toEqual([]);
    expect(shuffledIndexOrder(1, [0], () => 0.5)).toEqual([0]);
  });
});
