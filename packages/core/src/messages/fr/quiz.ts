import type { en } from "../en";
import type { MessageShape } from "../type";

export const quiz: MessageShape<(typeof en)["Quiz"]> = {
  QuestionReview: {
    question: "Question {number}",
    correct: "Correct",
    wrong: "Incorrect",
    noAnswer: "Aucune réponse",
    true: "Vrai",
    false: "Faux",
    option: "Option {number}",
    yourAnswer: "Ta réponse :",
    correctAnswer: "Bonne réponse :",
    handwritten: "Note manuscrite",
  },
  Runner: {
    loading: "Préparation de ton quiz…",
    startError: "Impossible de démarrer le quiz.",
    submitError: "Impossible d'envoyer le quiz.",
    tryAgain: "Réessayer",
    backToQuizzes: "Retour aux quiz",
    score: "{correct} / {total} correctes",
    everyAnswerLanded: "Toutes les réponses sont justes.",
    reviewMissed: "Revois les erreurs ci-dessous, puis réessaie.",
    retake: "Refaire",
    fullReview: "Revue complète",
    questionProgress: "Question {current} sur {total}",
    answeredProgress: "{answered} sur {total} répondues",
    blank: "Trou {number}",
    back: "Retour",
    next: "Suivant",
    submitting: "Envoi…",
    submit: "Envoyer le quiz",
  },
};
