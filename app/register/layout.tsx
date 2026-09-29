// Страница — клиентский компонент и не может отдать metadata сама.
export const metadata = { title: 'Sign up' };

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
