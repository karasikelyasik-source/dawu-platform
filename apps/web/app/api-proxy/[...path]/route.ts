import { NextRequest } from 'next/server';

const API_URL = 'http://localhost:3000';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const path = params.path.join('/');

  const url = `${API_URL}/${path}`;

  const body =
    request.method === 'GET'
      ? undefined
      : await request.text();

  const res = await fetch(url, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  const text = await res.text();

  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('Content-Type') || 'application/json',
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
