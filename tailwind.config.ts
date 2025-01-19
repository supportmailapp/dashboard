import tailwindcss from '@tailwindcss/vite';
import { Config } from 'tailwindcss';

import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    colors: {
      'dodger-blue': {
        '50': '#edfcff',
        '100': '#d6f6ff',
        '200': '#b5f1ff',
        '300': '#83eaff',
        '400': '#48dbff',
        '500': '#1ec0ff',
        '600': '#06a4ff',
        '700': '#0091ff',
        '800': '#086ec5',
        '900': '#0d5e9b',
        '950': '#0e385d',
      },
    },
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {},
  },

  plugins: [daisyui, tailwindcss],
} satisfies Config;
