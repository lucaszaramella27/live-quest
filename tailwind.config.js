/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: 'var(--color-primary)',
          'purple-dark': '#7C3AED',
          'purple-light': '#A78BFA',
          pink: 'var(--color-secondary)',
          'pink-light': '#F472B6',
          dark: 'var(--color-background)',
          'dark-secondary': 'var(--color-background-secondary)',
          'dark-tertiary': 'var(--color-background-tertiary)',
          gray: {
            light: 'var(--color-text-secondary)',
            medium: '#6B7280',
            dark: '#374151',
          }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      },
      keyframes: {
        // Fade animations
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slide animations
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Scale animations
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // Special effects - reduced
        'glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(139, 92, 246, 0.05), 0 0 10px rgba(139, 92, 246, 0.02)' 
          },
          '50%': { 
            boxShadow: '0 0 8px rgba(139, 92, 246, 0.08), 0 0 15px rgba(139, 92, 246, 0.03)' 
          },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'confetti-fall': {
          '0%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0',
          },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        'blob': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
      },
      animation: {
        // Fade animations
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in-down': 'fade-in-down 0.6s ease-out',
        // Slide animations
        'slide-in-left': 'slide-in-left 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        // Scale animations
        'scale-in': 'scale-in 0.4s ease-out',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        // Special effects
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 4s ease infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'confetti-fall': 'confetti-fall 3s ease-in forwards',
        'shake': 'shake 0.5s ease-in-out',
        'blob': 'blob 7s infinite',
      },
      animationDelay: {
        '2000': '2s',
        '4000': '4s',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
