import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,svelte,js,ts}'],

  theme: {
    colors: {
      'dodger-blue-50': '#edfcff',
      'dodger-blue-100': '#d6f6ff',
      'dodger-blue-200': '#b5f1ff',
      'dodger-blue-400': '#48dbff',
      'dodger-blue-500': '#1ec0ff',
      'dodger-blue-600': '#06a4ff',
      'dodger-blue-800': '#086ec5',
      'dodger-blue-950': '#0e385d',
    },
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
      roboto: ['Roboto'],
    },
    extend: {},
  },
} satisfies Config;
