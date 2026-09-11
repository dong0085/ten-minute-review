import { describe, expect, it } from "vitest";
import { parseJsonFromLlmText } from "./llm-json";

describe("parseJsonFromLlmText", () => {
  it("parses plain JSON", () => {
    expect(parseJsonFromLlmText('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips a json code fence", () => {
    expect(parseJsonFromLlmText('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("strips a bare code fence and surrounding whitespace", () => {
    expect(parseJsonFromLlmText('```\n{"a":[1,2]}\n```')).toEqual({ a: [1, 2] });
    expect(parseJsonFromLlmText('  {"a":true}  ')).toEqual({ a: true });
  });

  it("throws on malformed JSON", () => {
    expect(() => parseJsonFromLlmText("not json")).toThrow();
  });
});
