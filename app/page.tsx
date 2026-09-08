import Link from "next/link";
import { ArrowRight, FileUp, MessagesSquare } from "lucide-react";
import { AssistantMark } from "@/components/onboarding/assistant";
import { Card } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { activeQuestions, PROFESSIONS } from "@/lib/professions";
import { plural } from "@/lib/utils";

/**
 * Вход кандидата.
 *
 * Документ, раздел 2: «Когда кандидат приходит на платформу, мы не просто
 * говорим ему "Create your profile". Мы должны вести его за руку».
 *
 * Голосовое уточняет приоритет: «Я бы вообще "вручную" где-то там мелким
 * шрифтом добавила и всё делала бы ИИ». Поэтому на экране два пути, но они
 * не равны по весу — ручное заполнение уводится в сноску внизу.
 *
 * Страница серверная: вакансии и вход должны индексироваться (SEO — п. 3.6
 * договора).
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <div className="flex items-center gap-3">
        <AssistantMark size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-fg-subtle">HorecaPass</p>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Соберём ваше резюме за один разговор
          </h1>
        </div>
        <ThemeToggle className="shrink-0 self-start" />
      </div>

      <p className="mt-4 max-w-xl text-base leading-relaxed text-fg-muted">
        Не анкета на сорок полей. Я задам вопросы по вашей профессии — отвечайте
        голосом или текстом, а резюме соберётся само. Работает с телефона.
      </p>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
        Кем вы работаете?
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PROFESSIONS.map((p) => {
          // Показываем активные вопросы, а не все: часть зависит от ответов.
          const count = activeQuestions(p, {}).length;
          return (
            <Link
              key={p.id}
              href={`/onboarding?profession=${p.id}`}
              className="group rounded-lg focus-ring"
            >
              <Card className="flex h-full items-start gap-3 p-4 transition-shadow hover:shadow-lift">
                <MessagesSquare
                  size={20}
                  className="mt-0.5 shrink-0 text-primary-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-fg">{p.title}</span>
                    <ArrowRight
                      size={15}
                      className="text-fg-subtle transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <p className="mt-0.5 text-sm text-fg-muted">{p.blurb}</p>
                  <p className="mt-2 text-xs text-fg-subtle">
                    ~{count} {plural(count, "вопрос", "вопроса", "вопросов")} ·
                    свои параметры позиции
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-6 flex items-start gap-3 border-dashed p-4">
        <FileUp size={20} className="mt-0.5 shrink-0 text-fg-subtle" />
        <div>
          <p className="font-medium text-fg">Уже есть резюме?</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            Загрузите файл — разберём его и спросим только то, чего не хватает.
            Разбор делается на сервере, эндпоинт{" "}
            <code className="rounded bg-surface-3 px-1 text-xs">
              /api/ai/cv-parse/
            </code>{" "}
            ещё не готов, поэтому пока доступен только путь с вопросами.
          </p>
        </div>
      </Card>

      {/* Ручное заполнение — намеренно мелким шрифтом и последним. */}
      <p className="mt-8 text-xs text-fg-subtle">
        Предпочитаете заполнить всё руками, без вопросов?{" "}
        <Link
          href="/profile"
          className="underline underline-offset-4 hover:text-fg-muted"
        >
          Открыть пустой профиль
        </Link>
      </p>
    </main>
  );
}
