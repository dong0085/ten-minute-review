import { Alert } from "@/components/ui";
import { SignInForm } from "@/components/auth/signin-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const verified = first(params.verified) === "1";
  const error = first(params.error);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-600">Pick up where you left off.</p>
      </div>
      {verified ? (
        <Alert tone="success">Your email is verified. Sign in to continue.</Alert>
      ) : null}
      {error ? (
        <Alert tone="error">
          {error === "invite"
            ? "That invite code did not work. Create an account with a valid code."
            : "We could not sign you in. Please try again."}
        </Alert>
      ) : null}
      <SignInForm />
    </div>
  );
}
