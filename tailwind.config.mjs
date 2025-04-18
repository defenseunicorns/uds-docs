import { starlightTailwind } from '@astrojs/starlight-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [
    starlightTailwind()
  ],
};

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [
    starlightTailwind()
  ],
};
