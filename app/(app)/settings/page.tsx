'use client';

import { PageHeader } from '@/components/shell/app-shell';
import { AccountSection, AssistantSection, ConsentSection } from '@/components/settings/sections';

/** Настройки кандидата: помощник, согласие (с отзывом), аккаунт. */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-3xl space-y-4 px-5 py-6 md:px-8">
        <AssistantSection />
        <ConsentSection />
        <AccountSection />
      </div>
    </>
  );
}
