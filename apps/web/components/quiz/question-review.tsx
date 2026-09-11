"use client";

import { CATEGORIES, type Category } from "@tmr/core";
import { useTranslations } from "next-intl";
import { Badge, Card, cn } from "@/components/ui";

export type AnswerShape =
  | {
      index?: number | null;
      blanks?: (string | null)[] | null;
      value?: boolean | null;
    }
  | null
  | undefined;

export type ReviewCardQuestion = {
  position: number;
  category: string;
  type: string;
  stem: string;
  options: string[] | null;
  imageUrl?: string | null;
};

export function QuestionReviewCard({
  question,
  response,
  correctAnswer,
  isCorrect,
  explanation,
}: {
  question: ReviewCardQuestion;
  response: AnswerShape;
  correctAnswer?: AnswerShape;
  isCorrect?: boolean;
  explanation?: string;
}) {
  const t = useTranslations("Quiz.QuestionReview");
  const categoryT = useTranslations("Category");
  const categoryLabel =
    CATEGORIES.includes(question.category as Category)
      ? categoryT(question.category as Category)
      : question.category;

  function formatAnswer(type: string, shape: AnswerShape, options: string[] | null): string {
    if (!shape) {
      return t("noAnswer");
    }
    if (type === "true_false") {
      if (shape.value === true) {
        return t("true");
      }
      if (shape.value === false) {
        return t("false");
      }
      return t("noAnswer");
    }
    if (type === "mcq" || type === "image") {
      if (typeof shape.index !== "number") {
        return t("noAnswer");
      }
      return options?.[shape.index] ?? t("option", { number: shape.index + 1 });
    }
    const blanks = shape.blanks ?? [];
    if (blanks.length === 0 || blanks.every((blank) => !blank || blank.trim() === "")) {
      return t("noAnswer");
    }
    return blanks.map((blank) => (blank && blank.trim() !== "" ? blank : "—")).join(", ");
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">
            {t("question", { number: question.position })}
          </span>
          <Badge>{categoryLabel}</Badge>
        </div>
        {isCorrect !== undefined ? (
          <Badge tone={isCorrect ? "green" : "red"}>{isCorrect ? t("correct") : t("wrong")}</Badge>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm font-medium">{question.stem}</p>
      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt={t("handwritten")}
          className="mt-3 max-h-64 rounded-lg border border-neutral-200 object-contain"
        />
      ) : null}
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-neutral-500">{t("yourAnswer")}</dt>
          <dd className={cn(isCorrect === false && "font-medium text-red-700")}>
            {formatAnswer(question.type, response, question.options)}
          </dd>
        </div>
        {correctAnswer !== undefined ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-neutral-500">{t("correctAnswer")}</dt>
            <dd className="font-medium text-green-800">
              {formatAnswer(question.type, correctAnswer, question.options)}
            </dd>
          </div>
        ) : null}
      </dl>
      {explanation ? <p className="mt-3 text-sm text-neutral-600">{explanation}</p> : null}
    </Card>
  );
}
