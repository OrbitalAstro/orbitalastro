/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // OrbitalAstro Cosmic Palette - Design Logo (Rose Gold)
        'cosmic-gold': '#E4B5A0',
        'rose-gold': '#F5D4C1',
        'cosmic-pink': '#9B59B6',
        'cosmic-purple': '#2D1A4F',
        'magenta-purple': '#6B2D7D',
        'cosmic-black': '#1A0D2E',
        'cosmic-white': '#FFFFFF',
        'aurora-teal': '#3EF4C5',
        'eclipse-red': '#C44747',
        'horizon-blue': '#8BA8FF',
        // Legacy support (keep for backward compatibility)
        cosmic: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4b8fc',
          400: '#8190f8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        accent: ['Cinzel', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cosmic': 'linear-gradient(135deg, #2D1A4F 0%, #6B2D7D 50%, #E4B5A0 100%)',
        'cosmic-reverse': 'linear-gradient(135deg, #E4B5A0 0%, #6B2D7D 50%, #2D1A4F 100%)',
        'nebula': 'linear-gradient(135deg, #2D1A4F 0%, #6B2D7D 100%)',
        'aurora': 'linear-gradient(135deg, #3EF4C5 0%, #8BA8FF 100%)',
      },
      boxShadow: {
        'cosmic': '0 0 20px rgba(228, 181, 160, 0.4)',
        'nebula': '0 0 30px rgba(155, 89, 182, 0.4)',
        'glow': '0 0 40px rgba(228, 181, 160, 0.3), 0 0 80px rgba(245, 212, 193, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { opacity: '0.5', filter: 'blur(2px)' },
          '100%': { opacity: '1', filter: 'blur(4px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
