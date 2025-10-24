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

  // if none match
  const ifNoneMatch = request.headers.get('If-None-Match');
  if(ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(file.data, {
    headers: {
      'Cache-Control': 'max-age=31536000, immutable',
      'Content-Type': file.type,
      'Content-Length': file.data.byteLength.toString(),
      'ETag': etag,
    }
  });
}
