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
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        body:    ['"Space Grotesk"',       'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#080810',
          2: '#0f0f1a',
          3: '#161625',
          4: '#1d1d30',
          5: '#24243b',
        },
        border: {
          DEFAULT: '#1e1e30',
          2: '#2a2a42',
          3: '#363658',
        },
        content: {
          DEFAULT: '#f2f2fa',
          2: '#8e8eaa',
          3: '#55556e',
          4: '#30304a',
        },
        accent: {
          DEFAULT: '#7B61FF',
          hover:   '#6a50e8',
          light:   'rgba(123,97,255,0.12)',
          border:  'rgba(123,97,255,0.28)',
        },
        success: '#00C2A8',
        warning: '#FFB830',
        danger:  '#FF6B6B',
        teal:    '#00C2A8',
        sky:     '#4EA8DE',
      },
      borderRadius: {
        xl:  '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card:  '0 4px 32px rgba(0,0,0,0.5)',
        glow:  '0 0 32px rgba(123,97,255,0.2)',
        'glow-sm': '0 0 16px rgba(123,97,255,0.15)',
      },
      animation: {
        'fade-up':   'fadeUp 0.28s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':   'fadeIn 0.2s ease both',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.22,1,0.36,1) both',
        'bounce-dot': 'bounceDot 0.8s infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        bounceDot: { '0%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-5px)' } },
      },
    },
  },
  plugins: [],
}
