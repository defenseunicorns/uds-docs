/** @type {import('tailwindcss').Config} */
import starlightPlugin from '@astrojs/starlight-tailwind';

module.exports = {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'./node_modules/flowbite/**/*.js'
	],
	theme: {
		extend: {},
	},
	darkMode: ['selector', '[data-theme="dark"]'],
	plugins: [
		// Todo: potentially resolve issues with flowbite
		// require('flowbite-typography'),
		// require('flowbite/plugin'),
		starlightPlugin()
	],
}