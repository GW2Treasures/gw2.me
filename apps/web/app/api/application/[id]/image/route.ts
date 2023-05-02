import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const user = await getUser();

  if(!user) {
    return NextResponse.json({ error: true }, { status: 401 });
  }

  const data = await request.formData();

  const id = data.get('id')?.toString();
  const image = data.get('image');

  if(!id || !image || !(image instanceof Blob)) {
    return NextResponse.json({ error: true }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());

  const resized = await sharp(buffer)
    .resize({ width: 128, height: 128, withoutEnlargement: true })
    .toFormat('png')
    .toBuffer();

  await db.application.updateMany({
    where: { id, ownerId: user.id },
    data: { image: resized }
  });

  return new Response(resized, { headers: { 'Content-Type': 'image/png' }});
}

export async function GET(request: NextRequest, { params: { id }}: { params: { id: string }}) {
  const application = await db.application.findUnique({ where: { id }, select: { image: true }});

  if(!application || !application.image) {
    notFound();
  }

  return new Response(application.image, { headers: { 'Content-Type': 'image/png' }});
}
