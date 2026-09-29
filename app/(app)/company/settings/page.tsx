'use client';

import { PageHeader } from '@/components/shell/app-shell';
import { AccountSection, AssistantSection, VoiceSection, TeamSection } from '@/components/settings/sections';

/** Настройки работодателя: команда (приглашения), помощник, аккаунт. */
export default function CompanySettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-3xl space-y-4 px-5 py-6 md:px-8">
        <TeamSection />
        <AssistantSection />
        <VoiceSection />
        <AccountSection />
      </div>
    </>
  );
}
