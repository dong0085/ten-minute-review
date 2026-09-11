import Link from "next/link";
import {
  getEmailPreferences,
  getOrCreateReferralCode,
  listClassrooms,
  listQuizzesForUser,
  listReferralsByReferrer,
} from "@tmr/db";
import { languageName } from "@tmr/core";
import { Badge, Card } from "@/components/ui";
import { DeleteAccount } from "@/components/account/delete-account";
import { EmailPreferencesForm } from "@/components/account/email-preferences-form";
import { ProfileForm } from "@/components/account/profile-form";
import { formatQuizDate } from "@/components/quiz/question-review";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/session";

function formatWhen(value: Date): string {
  return value.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AccountPage() {
  const user = await requireUser();
  const db = getDb();
  const [preferences, classrooms, quizzes, referral, referrals] = await Promise.all([
    getEmailPreferences(db, user.id),
    listClassrooms(db, user.id),
    listQuizzesForUser(db, user.id),
    getOrCreateReferralCode(db, user.id),
    listReferralsByReferrer(db, user.id),
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
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold">Profile</h2>
        <ProfileForm
          defaultUsername={user.username}
          defaultUiLanguage={user.uiLanguage}
          defaultTimezone={user.timezone}
        />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Email preferences</h2>
        <EmailPreferencesForm
          defaultDailyEnabled={preferences?.dailyEnabled ?? true}
          defaultSendHourLocal={preferences?.sendHourLocal ?? 7}
          unsubscribedAt={
            preferences?.unsubscribedAt ? preferences.unsubscribedAt.toISOString() : null
          }
        />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Classrooms</h2>
        {classrooms.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No classrooms yet.{" "}
            <Link className="underline hover:text-neutral-900" href="/classrooms">
              Create one
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
                  {languageName(classroom.targetLanguage) ?? classroom.targetLanguage} ·{" "}
                  {languageName(classroom.nativeLanguage) ?? classroom.nativeLanguage}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Quiz history</h2>
        {groupedQuizzes.size === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No quizzes yet.</p>
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
                      {formatQuizDate(quiz.quizDate)}
                    </Link>
                    <span className="text-xs text-neutral-500">
                      {quiz.bestScore !== null
                        ? `Best ${quiz.bestScore}/${quiz.size}`
                        : `${quiz.size} questions`}{" "}
                      · {quiz.attemptCount}{" "}
                      {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Referrals</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Share your link. You and the person who signs up both get a free month.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded bg-neutral-100 px-2 py-1 text-sm">
            {referral.code ?? "Pending"}
          </code>
          <span className="break-all text-sm text-neutral-500">{shareUrl}</span>
        </div>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No sign-ups yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {referrals.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="text-neutral-600">Signed up {formatWhen(entry.createdAt)}</span>
                <Badge tone={entry.status === "rewarded" ? "green" : "neutral"}>
                  {entry.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Data</h2>
        <p className="mt-2 text-sm text-neutral-600">Download everything as JSON.</p>
        <a
          className="mt-3 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
          href="/api/me/export"
        >
          Export JSON
        </a>
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <DeleteAccount />
        </div>
      </Card>

      {process.env.NODE_ENV !== "production" ? (
        <Card>
          <h2 className="text-sm font-semibold">Subscription</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>Free</Badge>
            <p className="text-sm text-neutral-600">
              Billing is off in this build. Payment UI is hidden.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
