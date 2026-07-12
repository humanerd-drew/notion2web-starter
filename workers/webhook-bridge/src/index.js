import { createHmac } from 'node:crypto';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('x-notion-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const body = await request.text();

    const expected = createHmac('sha256', env.NOTION_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    if (signature !== expected) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);

    const pageId = payload?.data?.id;
    if (!pageId) {
      return new Response('Missing page_id', { status: 400 });
    }

    const resp = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'notion2web-bridge',
        },
        body: JSON.stringify({
          event_type: env.GITHUB_EVENT_TYPE,
          client_payload: { page_id: pageId },
        }),
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(`GitHub dispatch failed: ${err}`, { status: 502 });
    }

    return new Response('OK', { status: 200 });
  },
};
