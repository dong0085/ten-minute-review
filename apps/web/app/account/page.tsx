import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import {
  getActivityStats,
  getEmailPreferences,
  getLearningStats,
  getOrCreateReferralCode,
  listClassrooms,
  listQuizzesForUser,
  listRecentAttemptScores,
  listRecentMissesForUser,
  listReferralsByReferrer,
} from "@tmr/db";
import { Badge, Card } from "@/components/ui";
import { AccountStats } from "@/components/account/account-stats";
import { DeleteAccount } from "@/components/account/delete-account";
import { EmailPreferencesForm } from "@/components/account/email-preferences-form";
import { ProfileForm } from "@/components/account/profile-form";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { languageLabel } from "@/lib/language-label";
import { requireUser } from "@/lib/session";

export default async function AccountPage() {
  const user = await requireUser();
  const t = await getTranslations("Account");
  const locale = await getLocale();
  const format = await getFormatter();
  const db = getDb();
  const [
    preferences,
    classrooms,
    quizzes,
    referral,
    referrals,
    activity,
    learning,
    attempts,
    misses,
  ] = await Promise.all([
    getEmailPreferences(db, user.id),
    listClassrooms(db, user.id),
    listQuizzesForUser(db, user.id),
    getOrCreateReferralCode(db, user.id),
    listReferralsByReferrer(db, user.id),
    getActivityStats(db, user.id, user.timezone),
    getLearningStats(db, user.id),
    listRecentAttemptScores(db, user.id),
    listRecentMissesForUser(db, user.id),
  ]);

  const shareUrl = referral.code ? `${env.appUrl}/signup?code=${referral.code}` : env.appUrl;

  const groupedQuizzes = new Map<string, { classroomName: string; quizzes: typeof quizzes }>();
  for (const quiz of quizzes) {
    const group = groupedQuizzes.get(quiz.classroomId);
    if (group) {
      group.quizzes.push(quiz);
    } else {
      groupedQuizzes.set(quiz.classroomId, {
        classroomName: quiz.classroomName,
        quizzes: [quiz],
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.username ?? user.email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <Badge>{t("free")}</Badge>
          {user.username ? <span>{user.email}</span> : null}
          <span>
            {t("memberSince", {
              date: format.dateTime(user.createdAt, { month: "long", year: "numeric" }),
            })}
          </span>
        </div>
      </div>

      <AccountStats
        activity={activity}
        learning={learning}
        attempts={attempts}
        misses={misses}
      />

      <Card>
        <h2 className="text-sm font-semibold">{t("profileSection")}</h2>
        <ProfileForm
          defaultUsername={user.username}
          defaultUiLanguage={user.uiLanguage}
          defaultTimezone={user.timezone}
        />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">{t("emailPreferencesSection")}</h2>
        <EmailPreferencesForm
          defaultDailyEnabled={preferences?.dailyEnabled ?? true}
          defaultSendHourLocal={preferences?.sendHourLocal ?? 7}
          unsubscribedAt={
            preferences?.unsubscribedAt ? preferences.unsubscribedAt.toISOString() : null
          }
        />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">{t("classroomsSection")}</h2>
        {classrooms.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            {t("noClassrooms")}{" "}
            <Link className="underline hover:text-neutral-900" href="/classrooms">
              {t("createOne")}
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {classrooms.map((classroom) => (
              <li
                key={classroom.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <Link
                  className="font-medium hover:underline"
                  href={`/classrooms/${classroom.id}`}
                >
                  {classroom.name}
                </Link>
                <span className="text-xs text-neutral-500">
                  {t("languagePair", {
                    target: languageLabel(classroom.targetLanguage, locale),
                    native: languageLabel(classroom.nativeLanguage, locale),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">{t("quizHistorySection")}</h2>
        {groupedQuizzes.size === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t("noQuizzes")}</p>
        ) : (
          Array.from(groupedQuizzes.entries()).map(([classroomId, group]) => (
            <div key={classroomId} className="mt-4">
              <h3 className="text-sm font-medium">{group.classroomName}</h3>
              <ul className="mt-1 divide-y divide-neutral-100">
                {group.quizzes.map((quiz) => (
                  <li
                    key={quiz.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      className="text-neutral-700 hover:underline"
                      href={`/classrooms/${classroomId}/quiz/${quiz.id}`}
                    >
                      {format.dateTime(new Date(`${quiz.quizDate}T00:00:00`), {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Link>
                    <span className="text-xs text-neutral-500">
                      {quiz.bestScore !== null
                        ? t("bestScore", { score: quiz.bestScore, size: quiz.size })
                        : t("quizQuestions", { count: quiz.size })}{" "}
                      · {t("attempts", { count: quiz.attemptCount })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">{t("referralsSection")}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t("shareBlurb")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded bg-neutral-100 px-2 py-1 text-sm">
            {referral.code ?? t("pending")}
          </code>
          <span className="break-all text-sm text-neutral-500">{shareUrl}</span>
        </div>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{t("noSignUps")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {referrals.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="text-neutral-600">
                  {t("signedUp", {
                    when: format.dateTime(entry.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })}
                </span>
                <Badge tone={entry.status === "rewarded" ? "green" : "neutral"}>
                  {entry.status === "rewarded"
                    ? t("statusRewarded")
                    : entry.status === "signed_up"
                      ? t("statusSignedUp")
                      : t("statusCreated")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">{t("dataSection")}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t("exportBlurb")}</p>
        <a
          className="mt-3 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
          href="/api/me/export"
        >
          {t("exportButton")}
        </a>
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <DeleteAccount />
        </div>
      </Card>

      {process.env.NODE_ENV !== "production" ? (
        <Card>
          <h2 className="text-sm font-semibold">{t("subscriptionSection")}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>{t("free")}</Badge>
            <p className="text-sm text-neutral-600">{t("billingOff")}</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
