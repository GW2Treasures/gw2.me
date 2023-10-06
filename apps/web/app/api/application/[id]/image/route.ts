import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const placeholder = readFile(join(process.cwd(), 'app/api/application/[id]/image/app-placeholder.png'));

export async function GET(request: NextRequest, { params: { id }}: { params: { id: string }}) {
  const application = await db.application.findUnique({ where: { id }, select: { image: true }});

  if(!application || !application.image) {
    return new Response(await placeholder, { headers: { 'Content-Type': 'image/png' }});
  }

  return new Response(application.image, { headers: { 'Content-Type': 'image/png' }});
}
