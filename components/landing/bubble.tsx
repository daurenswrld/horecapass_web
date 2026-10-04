import { MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Реплика помощника — «мостик» из макета: белая карточка в тёмно-коричневой
 * рамке, над левым краем круглый тёмно-синий значок чата.
 *
 * Тексты реплик берутся только утверждённые (бриф и макет), не придумываются:
 * это голос продукта, заказчица вычитывает каждую фразу.
 */
export function Bubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'float-slow relative rounded-lg border-[1.5px] border-accent-strong bg-surface px-5 pb-4 pt-6 text-[15px] leading-snug text-text-primary shadow-lift dark:border-accent',
        className,
      )}
    >
      <span className="absolute -top-6 left-5 grid h-12 w-12 place-items-center rounded-full border-4 border-surface bg-heading text-surface dark:bg-accent dark:text-on-accent">
        <MessageSquareText size={18} aria-hidden />
      </span>
      {children}
    </div>
  );
}
