import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

import daisyui from 'daisyui';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

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

  plugins: [typography, forms, containerQueries, daisyui],

  daisyui: {
    styled: true,
    themes: ['night'],
    logs: false,
  },
} satisfies Config;
