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
        // OrbitalAstro Cosmic Palette
        'cosmic-gold': '#F6C94C',
        'cosmic-pink': '#E056FD',
        'cosmic-purple': '#3D1F71',
        'cosmic-black': '#000000',
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
        'cosmic': 'linear-gradient(135deg, #3D1F71 0%, #E056FD 50%, #F6C94C 100%)',
        'cosmic-reverse': 'linear-gradient(135deg, #F6C94C 0%, #E056FD 50%, #3D1F71 100%)',
        'nebula': 'linear-gradient(135deg, #3D1F71 0%, #E056FD 100%)',
        'aurora': 'linear-gradient(135deg, #3EF4C5 0%, #8BA8FF 100%)',
      },
      boxShadow: {
        'cosmic': '0 0 20px rgba(246, 201, 76, 0.3)',
        'nebula': '0 0 30px rgba(224, 86, 253, 0.4)',
        'glow': '0 0 40px rgba(246, 201, 76, 0.2), 0 0 80px rgba(224, 86, 253, 0.1)',
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
