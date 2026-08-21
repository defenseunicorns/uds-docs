import { test, expect } from './fixtures';

test('LLMS section sets contain the current release once', async ({ request }) => {
  const index = await request.get('/llms.txt');
  expect(index.ok()).toBe(true);
  const indexBody = await index.text();

  expect(indexBody.match(/^- \[Core > Getting Started\]/gm)).toHaveLength(1);
  expect(indexBody).not.toMatch(/core--getting-started-\d+\.txt/);

  const section = await request.get('/_llms-txt/core--getting-started.txt');
  expect(section.ok()).toBe(true);
  const sectionBody = await section.text();
  expect(sectionBody.match(/^# Set Up Your Environment$/gm)).toHaveLength(1);
});
