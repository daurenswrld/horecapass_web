import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthForm
        purpose="LOGIN"
        title="Sign in"
        subtitle="Enter the email your account is linked to. No password needed, we will send a code."
      />
      <p className="mt-6 text-sm text-text-secondary">
        No account?{" "}
        <Link href="/" className="font-semibold text-accent-text underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
