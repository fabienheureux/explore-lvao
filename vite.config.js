import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';
import tailwindcss from '@tailwindcss/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [    tailwindcss(),sveltekit()],
	preprocess: preprocess(),
	kit: {
		adapter: adapter({
			pages: 'docs',
			assets: 'docs'
		}),
		paths: {
			base: '/sveltekit-typescript'
		},
		prerender: {
			default: true
		},
		appDir: 'internal' // For github pages: https://www.npmjs.com/package/@sveltejs/adapter-static/v/next
	}
};

export default config;
