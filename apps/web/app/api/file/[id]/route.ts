import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { notFound } from 'next/navigation';

export async function GET(request: NextRequest, { params: { id }}: { params: { id: string }}) {
  const file = await db.file.findUnique({ where: { id }});

  if(!file) {
    notFound();
  }

  return new Response(file.data, {
    headers: {
      'Content-Type': file.type
    }
  });
}
