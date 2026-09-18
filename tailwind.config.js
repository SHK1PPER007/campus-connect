/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '420px',
      },
      colors: {
        campus: {
          bg: '#F4F4F0',          // Архитектурный нейтрально-белый фон
          surface: '#FFFFFF',     // Белоснежная карточка с жестким бордером
          dark: '#1E1E1E',        // Угольный швейцарский черный
          border: '#1E1E1E',      // Контур 1px solid
          text: '#111111',        // Контрастный заголовочный текст
          muted: '#555555',       // Читаемый основной текст
          subtle: '#888888',      // Служебная инфа / даты
          action: '#FF3E00',      // Швейцарский оранжево-красный
          'action-hover': '#E03600',
          ai: '#4A00FF',          // Электрический ультрафиолет для AI
          'ai-subtle': '#F0EBFF', // Нежная подложка для AI-блоков
          tag: '#EFEFEA',         // Цвет подложки тегов
          success: '#00A86B',     // Статус "Решено"
        },
      },
      boxShadow: {
        'none': 'none',
        'brutal-xs': '1px 1px 0px #1E1E1E',
        'brutal-sm': '2px 2px 0px #1E1E1E',
        'brutal': '3px 3px 0px #1E1E1E',
        'brutal-lg': '4px 4px 0px #1E1E1E',
        'brutal-ai': '3px 3px 0px #4A00FF',
        'brutal-action': '3px 3px 0px #FF3E00',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '0px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.025em',
        tighter: '-0.04em',
      },
    },
  },
  plugins: [],
};
