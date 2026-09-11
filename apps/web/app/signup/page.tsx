import { Alert } from "@/components/ui";
import { SignUpForm } from "@/components/auth/signup-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = first(params.code) ?? "";
  const error = first(params.error);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your notes become a ten-minute quiz every morning.
        </p>
      </div>
      {error === "invite" ? (
        <Alert tone="error">A valid invite code is needed to sign up.</Alert>
      ) : null}
      <SignUpForm initialCode={code} />
    </div>
  );
}
