import {defineCollection, z} from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

// This is a universal banner for beta testing purposes.
// See: https://github.com/withastro/starlight/discussions/1535
//
// Revert to the original code after the banner is no longer needed!

// export const collections = {
// 	docs: defineCollection({ schema: docsSchema() }),
// };

export const collections = {
	docs: defineCollection({
		schema: docsSchema({
			extend: z.object({
				banner: z.object({ content: z.string() }).default({
					content:
						'This documentation site is in beta testing. Please report any issues <a href="https://github.com/defenseunicorns/uds-docs-refresh" target="_blank">here</a>.',
				}),
			}),
		}),
	}),
};
