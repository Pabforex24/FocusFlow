/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Désactive le prerendering statique — toutes les pages sont rendues côté client
  // Nécessaire car le store Zustand utilise localStorage (window)
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
