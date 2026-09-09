import { AppShell } from "@/components/shell/app-shell";

/** Всё, что внутри этой группы, доступно только после входа. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
