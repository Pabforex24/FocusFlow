/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body:    ['Outfit', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#050812',
          2: '#090d1a',
          3: '#0e1224',
          4: '#141830',
          5: '#1a2040',
        },
        border: {
          DEFAULT: '#1a2035',
          2: '#24304a',
          3: '#2e3d5e',
        },
        content: {
          DEFAULT: '#E8EDF7',
          2: '#7A8BAD',
          3: '#3D4F6E',
          4: '#1E2A40',
        },
        accent: {
          DEFAULT: '#00E5B0',
          hover:   '#00CCA0',
          dim:     'rgba(0,229,176,0.12)',
          border:  'rgba(0,229,176,0.25)',
        },
        amethyst: {
          DEFAULT: '#7B5EA7',
          dim:     'rgba(123,94,167,0.12)',
        },
        copper: {
          DEFAULT: '#C8865A',
          dim:     'rgba(200,134,90,0.12)',
        },
        cyan: {
          DEFAULT: '#3DD8FA',
          dim:     'rgba(61,216,250,0.10)',
        },
        success: '#00E5B0',
        warning: '#C8865A',
        danger:  '#FF5E7A',
      },
      borderRadius: {
        xl:    '14px',
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        card:           '0 4px 32px rgba(0,0,0,0.65)',
        'card-lg':      '0 8px 48px rgba(0,0,0,0.70)',
        'glow-accent':  '0 0 24px rgba(0,229,176,0.22)',
        'glow-amethyst':'0 0 24px rgba(123,94,167,0.25)',
        'glow-copper':  '0 0 24px rgba(200,134,90,0.20)',
        'glow-sm':      '0 0 12px rgba(0,229,176,0.15)',
        neuo:           '4px 4px 10px rgba(0,0,0,0.55), -2px -2px 6px rgba(255,255,255,0.025)',
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #00E5B0 0%, #7B5EA7 50%, #C8865A 100%)',
        'gradient-accent':  'linear-gradient(135deg, #00E5B0 0%, #3DD8FA 100%)',
        'gradient-glass':   'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.30s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':    'fadeIn 0.22s ease both',
        'scale-in':   'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
        'bounce-dot': 'bounceDot 0.8s infinite',
        shimmer:      'shimmer 4s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        bounceDot: { '0%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-5px)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 8px rgba(0,229,176,0.15)' }, '50%': { boxShadow: '0 0 22px rgba(0,229,176,0.40)' } },
      },
    },
  },
  plugins: [],
}
