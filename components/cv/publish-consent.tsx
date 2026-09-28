'use client';

import * as React from 'react';
import { ArrowRight, BadgeCheck, Check } from 'lucide-react';
import { DemoNotice } from '@/components/demo-notice';
import { SignaturePad } from '@/components/employer/signature-pad';
import { Button, Card, Field } from '@/components/ui/primitives';
import { cvConsent, type CvConsent } from '@/lib/demo/storage';
import { PRIVACY_URL } from '@/lib/legal';

/**
 * Публикация резюме — только после согласия, подписанного от руки.
 *
 * Требование заказчицы от 17.09: без него «мы не можем никого пускать на
 * платформу»; перечень данных — её: имя, телефон, почта, опыт работы.
 * Экран и формулировки — из брифа кандидата (22.09), пункт 6.
 */
const CONSENT_LINES = [
  'I agree to let HorecaPass store and process my personal data (CV, photo, work history, contact details).',
  'I agree to share my profile with employers on the platform.',
  'I agree to be contacted about relevant job opportunities by email or WhatsApp.',
  'I understand I can withdraw this consent at any time in Settings.',
];
export function PublishConsent({ defaultName, onSigned }: { defaultName: string; onSigned?: () => void }) {
  const [c, setC] = React.useState<CvConsent | null>(null);

  React.useEffect(() => {
    const loaded = cvConsent.load();
    setC({ ...loaded, signer: loaded.signer || defaultName });
  }, [defaultName]);

  if (!c) return null;

  const set = (patch: Partial<CvConsent>) => {
    const next = { ...c, ...patch };
    setC(next);
    cvConsent.save(next);
  };

  if (c.signedAt) {
    return (
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <BadgeCheck size={28} aria-hidden className="shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-heading">Your profile is ready to be published</p>
          <p className="mt-0.5 text-sm text-text-secondary">
            Consent signed by {c.signer} on{' '}
            {new Date(c.signedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => set({ signedAt: null })}>
          Withdraw consent
        </Button>
      </Card>
    );
  }

  // Бриф кандидата, пункт 6: подпись — это и есть согласие, кнопка неактивна,
  // пока подписи нет. Галочки «I agree» нет намеренно: её никто не читает.
  const ready = c.signer.trim().length > 2 && !!c.signature;

  return (
    <Card className="space-y-5 p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-heading">Before we continue</h2>
        <p className="mt-1.5 text-text-secondary">
          Please review and sign to confirm your consent. Employers can only see your profile after this.
        </p>
      </div>

      {/* Крупный чёрный шрифт, а не серый мелкий — «юридический текст не
          должен выглядеть как мелкий шрифт, который никто не читает». Тексты —
          черновик из брифа, финальные согласует юрист. */}
      <ul className="space-y-3 text-lg leading-snug text-text-primary">
        {CONSENT_LINES.map((line) => (
          <li key={line} className="flex gap-3">
            <Check size={20} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
            {line}
          </li>
        ))}
      </ul>
      <p className="text-sm text-text-secondary">
        Your name, phone number, email and work experience become visible to employers on the platform. See the{' '}
        <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="font-medium text-accent-text underline underline-offset-4">
          Privacy Policy
        </a>
        .
      </p>

      <div className="max-w-md">
        <Field label="Your full name" value={c.signer} onChange={(e) => set({ signer: e.target.value })} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">Signature</p>
        <SignaturePad value={c.signature} onChange={(signature) => set({ signature })} />
      </div>

      <DemoNotice
        what="The signed consent stays in this browser, and the profile is not actually published: both need the server."
        endpoint="POST /api/resumes/my/<id>/publish-consent/ (full name, signature image) and publishing the resume"
      />

      <Button
        size="lg"
        disabled={!ready}
        onClick={() => {
          set({ agreed: true, signedAt: new Date().toISOString() });
          onSigned?.();
        }}
      >
        Confirm &amp; Continue
        <ArrowRight size={17} aria-hidden />
      </Button>
    </Card>
  );
}
