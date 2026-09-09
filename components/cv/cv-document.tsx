"use client";

import * as React from "react";
import { Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { DemoNotice } from "@/components/demo-notice";
import {
  activeQuestions,
  isBlank,
  type Answers,
  type CvSlot,
  type Profession,
  type Question,
} from "@/lib/professions";
import { cn, plural } from "@/lib/utils";

/**
 * Профиль кандидата в виде резюме.
 *
 * Заказчица: «в конце итоги резюме, то есть профайл кандидата, должен
 * выглядеть как красиво сделанное резюме, а не как профайл в платформе».
 *
 * Отсюда решения по вёрстке:
 *  • лист с полями и колонками, а не карточки-плитки платформы;
 *  • профессиональная специфика идёт выше общих навыков — ради неё резюме
 *    и открывают;
 *  • цифры (covers, команда, outlets) вынесены в отдельную строку: это то,
 *    по чему шефа и менеджера сравнивают в первую очередь.
 */

interface Props {
  profession: Profession;
  answers: Answers;
  candidateName?: string;
  onEdit?: (questionId: string) => void;
}

const SLOT_TITLES: Partial<Record<CvSlot, string>> = {
  specifics: "Профессиональная специфика",
  systems: "Системы",
  skills: "Навыки",
  languages: "Языки",
  portfolio: "Портфолио и документы",
};

function formatValue(q: Question, v: unknown): string {
  if (Array.isArray(v)) return v.join(" · ");
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  if (q.kind === "scale") return `${v} / ${q.max ?? 5}`;
  if (q.unit) return `${v} ${q.unit}`;
  return String(v);
}

/** Professional summary: фрагменты собираются в предложения, каждое с большой
 *  буквы. Иначе получается «12 лет в HoReCa. основная секция — Grill». */
function summary(parts: string[]): string {
  if (parts.length === 0)
    return "Профиль пока пустой — пройдите анкету, и здесь появится краткое описание.";
  return (
    parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(". ") + "."
  );
}

function Row({
  q,
  value,
  onEdit,
}: {
  q: Question;
  value: unknown;
  onEdit?: (id: string) => void;
}) {
  return (
    <div className="group grid grid-cols-[9rem_1fr] gap-x-4 gap-y-1 py-2 max-sm:grid-cols-1">
      <dt className="text-xs uppercase tracking-wide text-text-secondary">
        {q.label}
      </dt>
      <dd className="flex items-start justify-between gap-2 text-sm text-text-primary">
        <span className={q.kind === "text" ? "leading-relaxed" : undefined}>
          {formatValue(q, value)}
        </span>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(q.id)}
            aria-label={`Изменить: ${q.label}`}
            className="shrink-0 rounded p-1 text-text-secondary opacity-0 transition-opacity hover:text-text-primary focus-ring group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Pencil size={13} />
          </button>
        )}
      </dd>
    </div>
  );
}

function Section({
  title,
  questions,
  answers,
  onEdit,
}: {
  title: string;
  questions: Question[];
  answers: Answers;
  onEdit?: (id: string) => void;
}) {
  const filled = questions.filter((q) => !isBlank(answers[q.id]));
  if (filled.length === 0) return null;

  // Раздел из одного поля, чья подпись повторяет заголовок раздела («Языки /
  // Языки»), печатаем без подписи — в резюме это выглядит как опечатка.
  const single =
    filled.length === 1 &&
    filled[0].label.toLowerCase() === title.toLowerCase();

  return (
    <section className="border-t border-line pt-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent-text">
        {title}
      </h2>
      {single ? (
        <p className="py-1 text-sm text-text-primary">
          {formatValue(filled[0], answers[filled[0].id])}
        </p>
      ) : (
        <dl className="divide-y divide-line">
          {filled.map((q) => (
            <Row key={q.id} q={q} value={answers[q.id]} onEdit={onEdit} />
          ))}
        </dl>
      )}
    </section>
  );
}

export function CvDocument({
  profession,
  answers,
  candidateName = "Ваше имя",
  onEdit,
}: Props) {
  const [note, setNote] = React.useState<string | null>(null);
  const questions = activeQuestions(profession, answers);
  const bySlot = (slot: CvSlot) => questions.filter((q) => q.slot === slot);

  const level =
    typeof answers.level === "string" ? answers.level : profession.title;
  const years = answers.years;
  const languages = Array.isArray(answers.languages) ? answers.languages : [];

  // Строка масштаба: числа, по которым кандидатов сравнивают глазами.
  const scale = bySlot("scale").filter((q) => !isBlank(answers[q.id]));

  const attachments = [
    ...(Array.isArray(answers.certificates) ? answers.certificates : []),
    ...(Array.isArray(answers.dish_photos) ? answers.dish_photos : []),
  ];

  const handleDownload = () => {
    // Собирать вложения в один архив с пересжатием должен сервер: в браузере
    // «файлов» нет, есть только их имена.
    setNote(
      `Файлов к выгрузке: ${attachments.length}. Архив собирает сервер — эндпоинта пока нет.`,
    );
  };

  return (
    <article className="w-full rounded-lg border border-line bg-surface p-6 shadow-card sm:p-10">
      <header className="flex flex-col gap-5 pb-5 sm:flex-row sm:items-start">
        {/* Портрет — обязательное поле по правке Алдияра. */}
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted text-center text-[11px] leading-tight text-text-secondary">
          {isBlank(answers.photo_portrait)
            ? "Портретное\nфото"
            : "Фото\nзагружено"}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {candidateName}
          </h1>
          <p className="mt-0.5 text-base text-accent-text">{level}</p>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {/* Professional summary собирается из ответов, а не пишется кандидатом
                вручную: заполнять «о себе» — первое, на чём люди бросают анкету. */}
            {summary(
              [
                !isBlank(years) &&
                  `${years} ${plural(Number(years), "год", "года", "лет")} в HoReCa`,
                Array.isArray(answers.venue_types) &&
                  answers.venue_types.length > 0 &&
                  answers.venue_types.join(", "),
                typeof answers.main_section === "string" &&
                  `основная секция — ${answers.main_section}`,
                languages.length > 0 && `языки: ${languages.join(", ")}`,
              ].filter(
                (x): x is string => typeof x === "string" && x.length > 0,
              ),
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
            {!isBlank(answers.height_cm) && (
              <span>Рост {String(answers.height_cm)} см</span>
            )}
            {!isBlank(answers.weight_kg) && (
              <span>Вес {String(answers.weight_kg)} кг</span>
            )}
            {!isBlank(answers.visa_status) && (
              <span>{String(answers.visa_status)}</span>
            )}
            {!isBlank(answers.relocation) && (
              <span>Релокация: {String(answers.relocation)}</span>
            )}
          </div>
        </div>
      </header>

      {scale.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-4">
          {scale.map((q) => (
            <div key={q.id} className="bg-surface-muted px-3 py-3 text-center">
              <div className="text-lg font-semibold text-text-primary">
                {String(answers[q.id])}
              </div>
              <div className="text-[11px] leading-tight text-text-secondary">
                {q.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-10 xl:space-y-0 xl:[&>section]:mb-4">
        {(["specifics", "skills", "systems", "languages"] as CvSlot[]).map(
          (slot) => (
            <Section
              key={slot}
              title={SLOT_TITLES[slot] ?? slot}
              questions={bySlot(slot)}
              answers={answers}
              onEdit={onEdit}
            />
          ),
        )}

        <section className="border-t border-line pt-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent-text">
            {SLOT_TITLES.portfolio}
          </h2>
          {attachments.length === 0 ? (
            <p className="text-sm text-text-secondary">Пока ничего не загружено.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {attachments.map((name) => (
                  <span
                    key={String(name)}
                    className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs text-text-secondary"
                  >
                    {String(name)}
                  </span>
                ))}
              </div>
              {/* Правка Алдияра: выгрузка одним небольшим файлом. */}
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={handleDownload}
              >
                <Download size={15} />
                Скачать одним файлом
              </Button>
            </>
          )}
          {note && (
            <DemoNotice
              className="mt-3"
              what={note}
              endpoint="GET /api/resumes/my/<id>/attachments.zip"
            />
          )}
        </section>
      </div>

      <footer
        className={cn("mt-6 border-t border-line pt-4 text-xs text-text-secondary")}
      >
        Резюме собрано автоматически из ваших ответов. Любое поле можно
        поправить вручную — наведите на строку.
      </footer>
    </article>
  );
}
