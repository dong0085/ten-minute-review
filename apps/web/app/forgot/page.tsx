import { ForgotForm } from "@/components/auth/forgot-form";

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-600">
          We will email you a link to choose a new password.
        </p>
      </div>
      <ForgotForm />
    </div>
  );
}
