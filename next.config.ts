import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Вакансии должны индексироваться — SEO это пункт 3.6 договора.
  // Поэтому публичные страницы рендерятся на сервере, а не в браузере.
  poweredByHeader: false,
  images: {
    // Аватары и фото блюд приходят с того же сервера, что и у мобилки.
    remotePatterns: [{ protocol: 'https', hostname: 'api.horecapass.com' }],
  },
};

export default nextConfig;
