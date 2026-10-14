'use client';

import { GeorgeChat } from '@/components/admin/george';
import { AdminHeader } from '@/components/admin/ui';

/** A-15: Джордж на весь экран. */
export default function GeorgePage() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <AdminHeader
        title="George"
        subtitle="AI analyst: ask about the platform's numbers, get answers and lists to download"
      />
      <div className="min-h-0 flex-1">
        <GeorgeChat />
      </div>
    </div>
  );
}
