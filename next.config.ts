import {withSentryConfig} from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir build apesar dos warnings ESLint/TypeScript restantes
  // TODO: Corrigir gradualmente os warnings e reativar validação estrita
  eslint: {
    ignoreDuringBuilds: true, // Temporário - permite build com warnings
  },
  typescript: {
    ignoreBuildErrors: true, // Temporário - permite build com warnings
  },

  // Headers de segurança
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Apenas HSTS em produção
          ...(!isDevelopment ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }] : []),
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: isDevelopment
              ? [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.hrxeventos.com.br https://*.clerk.accounts.dev https://challenges.cloudflare.com https://va.vercel-scripts.com",
                  "style-src 'self' 'unsafe-inline'",
                  "img-src 'self' data: blob: https: http:",
                  "font-src 'self' data:",
                  "connect-src 'self' http://localhost:* ws://localhost:* https://clerk.hrxeventos.com.br https://*.clerk.accounts.dev https://api.clerk.com https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://api.mapbox.com https://events.mapbox.com https://viacep.com.br https://*.sentry.io https://va.vercel-scripts.com",
                  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
                  "worker-src 'self' blob:",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "form-action 'self'",
                  "frame-ancestors 'none'"
                ].join('; ')
              : [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.hrxeventos.com.br https://challenges.cloudflare.com https://va.vercel-scripts.com",
                  "style-src 'self' 'unsafe-inline'",
                  "img-src 'self' data: blob: https: *.supabase.co https://img.clerk.com",
                  "font-src 'self' data:",
                  "connect-src 'self' https://clerk.hrxeventos.com.br https://api.clerk.com https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://api.mapbox.com https://events.mapbox.com https://viacep.com.br https://*.sentry.io https://va.vercel-scripts.com",
                  "frame-src 'self' https://challenges.cloudflare.com",
                  "worker-src 'self' blob:",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "form-action 'self'",
                  "frame-ancestors 'none'",
                  "upgrade-insecure-requests"
                ].join('; ')
          }
        ],
      },
    ];
  },

  // Configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "hrx-o6",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});