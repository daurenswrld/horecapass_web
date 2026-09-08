"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingChat } from "@/components/onboarding/chat";
import { getProfession } from "@/lib/professions";

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const profession = getProfession(params.get("profession"));

  React.useEffect(() => {
    // Профессия задаёт весь набор вопросов — без неё диалог начинать нечем.
    if (!profession) router.replace("/");
  }, [profession, router]);

  if (!profession) return null;

  return (
    <OnboardingChat
      profession={profession}
      onDone={() => router.push("/profile")}
    />
  );
}

export default function OnboardingPage() {
  // useSearchParams требует Suspense: без него страница целиком уходит
  // в клиентский рендер и теряет серверную отрисовку.
  return (
    <React.Suspense fallback={null}>
      <OnboardingInner />
    </React.Suspense>
  );
}
