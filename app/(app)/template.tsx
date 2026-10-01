/** Мягкий вход страницы при переходе между разделами. Шаблон, в отличие от
 *  layout, пересоздаётся на каждой навигации, поэтому анимация играет заново. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
