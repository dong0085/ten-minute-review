export type QuestionKind = "mcq" | "fill_blank" | "true_false" | "image";

export type QuizQuestion = {
  id: string;
  position: number;
  category: string;
  type: QuestionKind;
  stem: string;
  options: string[] | null;
  imageUrl?: string | null;
};

export type LocalResponse = {
  index?: number | null;
  blanks?: (string | null)[];
  value?: boolean | null;
};
