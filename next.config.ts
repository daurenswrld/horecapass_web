import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Без этого Next отвечает 308 на любой путь с завершающим слэшем и уводит
   * запрос на вариант без него. Все маршруты Django заканчиваются слэшем —
   * прокси в таком виде отдавал 404 вместо ответа сервера.
   */
  skipTrailingSlashRedirect: true,

  images: {
    // Логотипы компаний и аватары приходят с того же сервера.
    remotePatterns: [{ protocol: 'https', hostname: 'api.horecapass.com' }],
  },
};

export default nextConfig;
