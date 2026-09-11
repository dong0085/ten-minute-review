import { describe, expect, it } from "vitest";
import { quizSize } from "./quiz-size";

describe("quizSize", () => {
  it("returns zero for an empty bank", () => {
    expect(quizSize(0)).toBe(0);
  });

  it("floors at 8 questions", () => {
    expect(quizSize(1)).toBe(8);
    expect(quizSize(60)).toBe(8);
    expect(quizSize(63)).toBe(8);
  });

  it("scales with the bank", () => {
    expect(quizSize(100)).toBe(12);
    expect(quizSize(159)).toBe(19);
  });

  it("caps at 20 questions", () => {
    expect(quizSize(160)).toBe(20);
    expect(quizSize(1000)).toBe(20);
  });
});
