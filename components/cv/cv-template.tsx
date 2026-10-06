/**
 * Шаблон резюме HorecaPass — бриф кандидата, пункт 5.
 *
 * Структура — как у резюме Careerteria, которые агентство уже отправляет
 * работодателям: шапка → Professional Summary → Skills в две колонки →
 * Work History с «Smart note» → Education → Languages → подвал. Вид —
 * «чтобы не выглядело как типовой AI-шаблон»: белый фон, чёрный текст,
 * бежевый только в фамилии, линиях под заголовками, названиях мест работы
 * и полосе Smart note. Без градиентных аватаров, «пилюль» и теней;
 * фото — простой прямоугольник с тонкой рамкой.
 *
 * Пустые секции не рисуются вовсе — никаких заглушек (тот же принцип,
 * что и в карточке вакансии).
 */

export interface CvData {
  firstName: string;
  lastName: string;
  role: string | null;
  nationality: string | null;
  years: number | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  work: { title: string; place: string | null; dates: string | null; bullets: string[]; smartNote?: string | null }[];
  education: string[];
  languages: string[];
  certificates: string[];
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b-2 border-cv-accent pb-1 text-[13px] font-bold uppercase tracking-[0.12em] text-cv-ink">{children}</h3>
  );
}

export function CvTemplate({ data, className }: { data: CvData; className?: string }) {
  const line = [
    data.role,
    data.nationality,
    data.years !== null ? `${data.years}+ years in hospitality` : null,
    data.location,
  ].filter(Boolean);

  return (
    <article
      className={`break-words bg-cv-paper px-5 py-6 font-sans text-[13.5px] leading-relaxed text-cv-ink sm:px-12 sm:py-9 ${className ?? ''}`}
      style={{ colorScheme: 'light' }}
    >
      <header className="flex items-start gap-4 border-b border-[rgb(var(--cv-ink)/0.15)] pb-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--cv-ink)/0.7)]">
            HorecaPass · horecapass.com
          </p>
          <h2 className="mt-2 break-words text-2xl font-bold leading-tight sm:text-3xl">
            {data.firstName} <span className="text-cv-accent">{data.lastName}</span>
          </h2>
          {line.length > 0 && <p className="mt-1 text-[rgb(var(--cv-ink)/0.8)]">{line.join(' · ')}</p>}
        </div>
      </header>

      {data.summary && (
        <section className="mt-6">
          <Heading>Professional Summary</Heading>
          <p className="mt-2">{data.summary}</p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mt-6">
          <Heading>Skills</Heading>
          <ul className="mt-2 grid list-disc gap-x-8 gap-y-1 pl-5 sm:grid-cols-2">
            {data.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {data.work.length > 0 && (
        <section className="mt-6">
          <Heading>Work History</Heading>
          <div className="mt-3 space-y-5">
            {data.work.map((w, i) => (
              <div key={i}>
                <p className="font-bold">
                  {w.title}
                  {w.place && <span className="font-semibold text-cv-accent"> · {w.place}</span>}
                </p>
                {w.dates && <p className="text-[12px] text-[rgb(var(--cv-ink)/0.6)]">{w.dates}</p>}
                {w.bullets.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                    {w.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {/* Врезка — только если Smart узнал значимое место работы. */}
                {w.smartNote && (
                  <p className="mt-2 border-l-[3px] border-cv-accent pl-3 text-[12.5px] text-[rgb(var(--cv-ink)/0.8)]">
                    <span className="font-semibold">Smart note: </span>
                    {w.smartNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mt-6">
          <Heading>Education</Heading>
          <ul className="mt-2 space-y-0.5">
            {data.education.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      )}

      {data.certificates.length > 0 && (
        <section className="mt-6">
          <Heading>Certificates</Heading>
          <p className="mt-2">{data.certificates.join(' · ')}</p>
        </section>
      )}

      {data.languages.length > 0 && (
        <section className="mt-6">
          <Heading>Languages</Heading>
          <p className="mt-2">{data.languages.join(' · ')}</p>
        </section>
      )}

      <footer className="mt-8 border-t border-[rgb(var(--cv-ink)/0.15)] pt-3 text-[11px] text-[rgb(var(--cv-ink)/0.6)]">
        Hospitality CV · horecapass.com
      </footer>
    </article>
  );
}
