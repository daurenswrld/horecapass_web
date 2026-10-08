/**
 * Резюме HorecaPass в макете дизайнера (Figma, раздел «resume», страницы A4).
 *
 * Шапка с фото → Professional Summary → Current Position (работодатель,
 * «About <работодатель>», Key Responsibilities, Key Achievements) → Career
 * History → Education → Languages → Core Skills → References. Это та же
 * раскладка, что у PDF, который собирает сервер; здесь она тянется под ширину
 * экрана. Размеры заданы в em от размера шрифта страницы (10 pt в макете), так
 * что всё масштабируется вместе.
 *
 * Цвета макета (#502D12, #80786B, #BC9876) на экране чуть темнее там, где текст:
 * оригинальные серый и песочный на белом дают 4.4:1 и 2.7:1. Пустые секции не
 * рисуются вовсе, заглушек нет.
 */

export interface CvJob {
  title: string;
  employer: string;
  location: string;
  period: string;
  /** Тип заведения · уровень · кухня — то, что работодателю из Залива не догадаться. */
  facts: string;
  about: string;
  responsibilities: string[];
  achievements: string[];
  /** Для прошлых мест: один список, как в макете. */
  bullets: string[];
}

export interface CvData {
  firstName: string;
  lastName: string;
  headline: string | null;
  location: string | null;
  nationality: string | null;
  photoUrl: string | null;
  summary: string | null;
  current: CvJob | null;
  history: CvJob[];
  education: { institution: string; what: string; years: string }[];
  languages: { name: string; level: string }[];
  skills: string[];
  certificates: string[];
  references: string[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-[2.4em]">
      <h3 className="border-b border-cv-line pb-[0.5em] text-[1.2em] font-normal uppercase leading-[1.2] text-cv-brown">{title}</h3>
      <div className="mt-[1em]">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[0.25em] pl-[0.6em]">
      {items.map((line) => (
        <li key={line} className="flex gap-[0.9em]">
          <span aria-hidden className="mt-[0.4em] shrink-0 text-[0.6em] leading-none">●</span>
          <span className="min-w-0">{line}</span>
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="mb-[0.4em] mt-[1.2em] font-bold">{children}</p>;
}

function JobHead({ job }: { job: CvJob }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-[1em]">
        <p className="min-w-0 text-[1.2em] font-bold leading-[1.2] text-cv-brown">{job.title}</p>
        {job.period && <p className="shrink-0 text-right">{job.period}</p>}
      </div>
      <p className="mt-[0.4em]">
        <span className="font-bold text-cv-tan-text underline">{job.employer}</span>
        {job.location && <span> &nbsp;—&nbsp; {job.location}</span>}
      </p>
    </>
  );
}

export function CvTemplate({ data, className }: { data: CvData; className?: string }) {
  const named = data.firstName.trim() || data.lastName.trim();
  const initials = `${data.firstName.trim()[0] ?? ''}${data.lastName.trim()[0] ?? ''}`.toUpperCase();
  const { current } = data;

  return (
    <article
      className={`mx-auto w-full max-w-[794px] break-words bg-cv-paper px-[1.8em] pb-[3em] pt-[2.2em] text-[12px] leading-[1.26] text-cv-grey sm:px-[4.8em] sm:text-[13.33px] ${className ?? ''}`}
      style={{ colorScheme: 'light', fontFamily: 'Arial, "Liberation Sans", Helvetica, sans-serif' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cv/wordmark.svg" alt="HorecaPass" width={85} height={13} className="h-[1.3em] w-auto" />

      <header className="mt-[2.2em] flex items-start gap-[1.1em] sm:mt-[2.7em] sm:gap-[2.2em]">
        {data.photoUrl ? (
          // Обычный img: адрес с сервера, формат и размер заранее неизвестны.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt="" className="h-[5.6em] w-[5.6em] shrink-0 rounded-[1em] object-cover sm:h-[10em] sm:w-[10em] sm:rounded-[1.2em]" />
        ) : (
          // Размер задан на обёртке, шрифт инициалов на вложенном элементе: em считается от своего font-size.
          <div aria-hidden className="grid h-[5.6em] w-[5.6em] shrink-0 place-items-center rounded-[1em] bg-cv-line sm:h-[10em] sm:w-[10em] sm:rounded-[1.2em]">
            <span className="text-[1.8em] font-bold text-cv-brown sm:text-[2.4em]">{initials || '·'}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.5em] font-bold uppercase leading-[1.2] text-cv-brown sm:text-[2em]">
            {named ? `${data.firstName} ${data.lastName}`.trim() : <span className="opacity-70">Your name</span>}
          </h2>
          {data.headline && <p className="mt-[0.4em] text-[1.1em] leading-[1.25] text-cv-brown sm:mt-[0.5em] sm:text-[1.2em]">{data.headline}</p>}
          <ul className="mt-[0.9em] space-y-[0.5em] sm:mt-[1.1em] sm:space-y-[0.7em]">
            {data.location && (
              <li className="flex flex-wrap items-center gap-x-[0.6em] gap-y-[0.1em]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cv/icon-location.svg" alt="" width={11} height={13} className="h-[1.3em] w-auto" />
                <span>Location</span>
                <span className="font-medium text-cv-tan-text">{data.location}</span>
              </li>
            )}
            {data.nationality && (
              <li className="flex flex-wrap items-center gap-x-[0.6em] gap-y-[0.1em]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cv/icon-person.svg" alt="" width={12} height={13} className="h-[1.3em] w-auto" />
                <span>Nation</span>
                <span className="font-medium text-cv-tan-text">{data.nationality}</span>
              </li>
            )}
          </ul>
        </div>
      </header>

      {data.summary && (
        <Section title="Professional Summary">
          <p className="whitespace-pre-line">{data.summary}</p>
        </Section>
      )}

      {current && (
        <Section title="Current Position">
          <JobHead job={current} />
          {current.about && (
            <>
              <SubHeading>About {current.employer}</SubHeading>
              <p className="-mt-[0.2em] whitespace-pre-line">{current.about}</p>
            </>
          )}
          {current.responsibilities.length > 0 && (
            <>
              <SubHeading>Key Responsibilities</SubHeading>
              <Bullets items={current.responsibilities} />
            </>
          )}
          {current.achievements.length > 0 && (
            <>
              <SubHeading>Key Achievements</SubHeading>
              <Bullets items={current.achievements} />
            </>
          )}
          {current.responsibilities.length === 0 && current.achievements.length === 0 && current.bullets.length > 0 && (
            <div className="mt-[0.8em]">
              <Bullets items={current.bullets} />
            </div>
          )}
        </Section>
      )}

      {data.history.length > 0 && (
        <Section title="Career History">
          <div className="space-y-[1.4em]">
            {data.history.map((job, i) => (
              <div key={`${job.employer}-${job.title}-${i}`}>
                <JobHead job={job} />
                {job.facts && <p className="mt-[0.2em]">{job.facts}</p>}
                {job.bullets.length > 0 && (
                  <div className="mt-[0.7em]">
                    <Bullets items={job.bullets} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.education.length > 0 && (
        <Section title="Education">
          <ul className="space-y-[0.3em]">
            {data.education.map((e, i) => (
              <li key={`${e.institution}-${i}`}>
                <span className="font-bold text-cv-tan-text underline">{e.institution}</span>
                {e.what && <span> &nbsp;—&nbsp; {e.what}</span>}
                {e.years && <span> &nbsp;—&nbsp; {e.years}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.languages.length > 0 && (
        <Section title="Languages">
          <p className="flex flex-wrap gap-x-[2.4em] gap-y-[0.3em]">
            {data.languages.map((l) => (
              <span key={l.name}>
                <span className="font-bold text-cv-tan-text">{l.name}</span>
                {l.level && <span> &nbsp;—&nbsp; {l.level}</span>}
              </span>
            ))}
          </p>
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section title="Core Skills">
          <p>{data.skills.join('  •  ')}</p>
        </Section>
      )}

      {data.certificates.length > 0 && (
        <Section title="Certificates">
          <p>{data.certificates.join('  •  ')}</p>
        </Section>
      )}

      {data.references.length > 0 && (
        <Section title="References">
          <ul className="space-y-[0.2em]">
            {data.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
