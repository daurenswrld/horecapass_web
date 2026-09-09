import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";

/**
 * Раздел, до которого ещё не дошли руки.
 *
 * Честно пишем, что здесь будет и какой эндпоинт это обслуживает, вместо
 * пустого экрана: заказчица уже получала демо, которое выглядело рабочим,
 * и отдельно на это указала.
 */
export function Soon({
  title,
  what,
  endpoint,
}: {
  title: string;
  what: string;
  endpoint?: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-5 py-6 md:px-8">
        <Card className="max-w-xl p-6">
          <p className="text-sm leading-relaxed text-text-primary">{what}</p>
          {endpoint && (
            <p className="mt-3 text-xs text-text-secondary">
              Data for this section already comes from{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5">{endpoint}</code> — the same
              endpoint the mobile app uses.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
