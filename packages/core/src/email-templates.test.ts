import { describe, expect, it } from "vitest";
import {
  renderDailyQuizEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
} from "./email-templates";

describe("email templates", () => {
  it("renders the verification email in French", () => {
    const message = renderVerificationEmail("https://example.com/verify?token=abc", "fr");
    expect(message.subject).toBe("Confirme ton adresse e-mail");
    expect(message.html).toContain("Confirmer mon adresse");
    expect(message.html).toContain("Si le bouton ne fonctionne pas");
    expect(message.text).toContain("https://example.com/verify?token=abc");
  });

  it("renders the password reset email in English", () => {
    const message = renderPasswordResetEmail("https://example.com/reset?token=abc", "en");
    expect(message.subject).toBe("Reset your password");
    expect(message.html).toContain("If the button does not work");
  });

  it("renders the daily quiz email in French", () => {
    const message = renderDailyQuizEmail({
      locale: "fr",
      username: "Marie",
      entries: [
        {
          classroomName: "Français avec Marie",
          quizUrl: "https://example.com/quiz/1",
          questions: [
            {
              position: 1,
              category: "vocabulary",
              type: "mcq",
              stem: "« l'étendoir » veut dire :",
              options: ["the clothes line", "the rent"],
            },
          ],
        },
      ],
    });
    expect(message.subject).toBe("Le quiz du jour : Français avec Marie");
    expect(message.text).toContain("Bonjour Marie,");
    expect(message.text).toContain("Répondre sur le site: https://example.com/quiz/1");
    expect(message.text).toContain("1. « l'étendoir » veut dire :");
  });

  it("renders the daily quiz email in English when the locale is English", () => {
    const message = renderDailyQuizEmail({
      locale: "en",
      username: null,
      entries: [
        {
          classroomName: "French with Marie",
          quizUrl: "https://example.com/quiz/1",
          questions: [],
        },
      ],
    });
    expect(message.subject).toBe("Today's quiz: French with Marie");
    expect(message.text).toContain("Hello,");
  });
});
