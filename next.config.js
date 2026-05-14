/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Cloudflare Workers / self-hosted
  output: 'standalone',

 serverExternalPackages: ['bcryptjs'],

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Rewrites para compatibilidad Cloudflare Pages
  async rewrites() {
    return []
  },
}

module.exports = nextConfig
