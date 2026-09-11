import type { en } from "../en";
import type { MessageShape } from "../type";

export const category: MessageShape<(typeof en)["Category"]> = {
  vocabulary: "Vocabulaire",
  phrase: "Expressions",
  grammar: "Grammaire",
  expression: "Expression",
  comprehension: "Compréhension",
};
