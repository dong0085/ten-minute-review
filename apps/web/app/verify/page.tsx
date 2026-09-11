import { VerifyView } from "@/components/auth/verify-view";

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verify your email</h1>
      </div>
      <VerifyView />
    </div>
  );
}
