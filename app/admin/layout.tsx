import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

/** Всё внутри /admin — только для сотрудников; пустой шаблон даёт анимацию входа. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
