import Link from "next/link";
import { Alert } from "@/components/ui";
import { ResetForm } from "@/components/auth/reset-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = first(params.token) ?? "";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
      </div>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <Alert tone="error">
          This reset link is invalid or has expired.{" "}
          <Link className="font-medium underline" href="/forgot">
            Request a new one
          </Link>
        </Alert>
      )}
    </div>
  );
}
