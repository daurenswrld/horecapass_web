import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthForm
        purpose="LOGIN"
        title="Вход"
        subtitle="Введите почту, к которой привязан аккаунт. Пароль не нужен — пришлём код."
      />
      <p className="mt-6 text-sm text-text-secondary">
        Нет аккаунта?{" "}
        <Link href="/" className="font-semibold text-accent-text underline-offset-4 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </AuthLayout>
  );
}
