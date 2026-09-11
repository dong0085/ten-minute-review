import { formatMessage, getMessages, type UiLocale } from "./messages";

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export function renderActionEmail(input: {
  locale: UiLocale;
  heading: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
}): { html: string; text: string } {
  const { actionFallback } = getMessages(input.locale).Email;
  const html = `<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717;">
    <h1 style="font-size: 20px;">${escapeHtml(input.heading)}</h1>
    <p>${escapeHtml(input.body)}</p>
    <p><a href="${escapeHtml(input.actionUrl)}" style="display: inline-block; background: #171717; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">${escapeHtml(input.actionLabel)}</a></p>
    <p style="color: #737373; font-size: 13px;">${escapeHtml(actionFallback)} ${escapeHtml(input.actionUrl)}</p>
  </body>
</html>`;
  const text = `${input.heading}\n\n${input.body}\n\n${input.actionLabel}: ${input.actionUrl}\n`;
  return { html, text };
}

export function renderVerificationEmail(link: string, locale: UiLocale) {
  const messages = getMessages(locale).Email;
  return {
    subject: messages.verificationSubject,
    ...renderActionEmail({
      locale,
      heading: messages.verificationSubject,
      body: messages.verificationBody,
      actionLabel: messages.verificationAction,
      actionUrl: link,
    }),
  };
}

export function renderPasswordResetEmail(link: string, locale: UiLocale) {
  const messages = getMessages(locale).Email;
  return {
    subject: messages.resetSubject,
    ...renderActionEmail({
      locale,
      heading: messages.resetSubject,
      body: messages.resetBody,
      actionLabel: messages.resetAction,
      actionUrl: link,
    }),
  };
}

export type DailyQuizEmailEntry = {
  classroomName: string;
  quizUrl: string;
  questions: {
    position: number;
    category: string;
    type: string;
    stem: string;
    options: string[] | null;
  }[];
};

export function renderDailyQuizEmail(input: {
  locale: UiLocale;
  username: string | null;
  entries: DailyQuizEmailEntry[];
}): { subject: string; html: string; text: string } {
  const messages = getMessages(input.locale).Email;
  const greeting = input.username
    ? formatMessage(messages.greetingNamed, { name: input.username })
    : messages.greetingAnonymous;
  const subject =
    input.entries.length === 1
      ? formatMessage(messages.dailySubjectOne, {
          classroom: input.entries[0]?.classroomName ?? messages.yourClassroom,
        })
      : formatMessage(messages.dailySubjectMany, { count: input.entries.length });
  const intro = input.entries.length > 1 ? messages.dailyIntroMany : messages.dailyIntro;

  const sections = input.entries
    .map((entry) => {
      const questions = entry.questions
        .map((question) => {
          const options = question.options
            ? `<ol type="a" style="margin: 4px 0 12px 20px;">${question.options
                .map((option) => `<li>${escapeHtml(option)}</li>`)
                .join("")}</ol>`
            : "";
          return `<li style="margin-bottom: 12px;"><strong>${escapeHtml(question.stem)}</strong>${options}</li>`;
        })
        .join("");
      return `<section style="margin-bottom: 28px;">
  <h2 style="font-size: 17px;">${escapeHtml(entry.classroomName)}</h2>
  <ol>${questions}</ol>
  <p><a href="${escapeHtml(entry.quizUrl)}">${escapeHtml(messages.answerOnWeb)}</a></p>
</section>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717;">
    <p>${escapeHtml(greeting)}</p>
    <p>${escapeHtml(intro)}</p>
    ${sections}
  </body>
</html>`;

  const textSections = input.entries
    .map((entry) => {
      const questions = entry.questions
        .map((question) => {
          const options = question.options
            ? `\n${question.options.map((option, index) => `  ${String.fromCharCode(97 + index)}) ${option}`).join("\n")}`
            : "";
          return `${question.position}. ${question.stem}${options}`;
        })
        .join("\n");
      return `${entry.classroomName}\n${questions}\n${messages.answerOnWeb}: ${entry.quizUrl}`;
    })
    .join("\n\n");

  const text = `${greeting}\n\n${intro}\n\n${textSections}\n`;
  return { subject, html, text };
}
