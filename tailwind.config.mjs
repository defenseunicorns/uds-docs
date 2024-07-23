/** @type {import('tailwindcss').Config} */
import starlightPlugin from '@astrojs/starlight-tailwind';

export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		"./node_modules/flowbite/**/*.js"
	],
	theme: {
		extend: {},
	},
	darkMode: 'media',
	plugins: [
		// Some styling currently breaks if this is enabled
		// require('flowbite/plugin'),
		starlightPlugin()
	]
}
