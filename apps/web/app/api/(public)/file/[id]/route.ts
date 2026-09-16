import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { notFound } from 'next/navigation';

export async function GET(request: NextRequest, { params }: RouteContext<'/api/file/[id]'>) {
  const { id } = await params;
  const file = await db.file.findUnique({ where: { id }});

  if(!file) {
    notFound();
  }

  const etag = `"${file.sha256}"`;
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': etag,
  };

  const ifNoneMatch = request.headers.get('If-None-Match');
  const hasMatchingEtag = ifNoneMatch?.split(',').some((candidate) => {
    const trimmedCandidate = candidate.trim();
    return trimmedCandidate === '*' || trimmedCandidate === etag || trimmedCandidate === `W/${etag}`;
  });

  if(hasMatchingEtag) {
    return new Response(null, {
      status: 304,
      headers: cacheHeaders,
    });
  }

  return new Response(file.data, {
    headers: {
      ...cacheHeaders,
      'Content-Type': file.type,
      'Content-Length': file.data.byteLength.toString(),
    }
  });
}
