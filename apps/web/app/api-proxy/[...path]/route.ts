import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://31.57.201.45:3000';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const path = params.path.join('/');

  const url = `${API_URL}/${path}${request.nextUrl.search}`;

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.text();

  const response = await fetch(url, {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    },
    body,
    cache: 'no-store',
  });

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;