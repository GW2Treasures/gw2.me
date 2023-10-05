import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

export async function editApplication(id: string, _: FormState, form: FormData): Promise<FormState> {
  'use server';

  const user = await getUser();

  if(!user) {
    return { error: 'Not logged in' };
  }

  const name = form.get('name');
  const description = form.get('description');
  const publicRaw = form.get('public');
  const publicUrl = form.get('publicUrl');
  const callbackUrlsRaw = form.get('callbackUrls');
  const imageRaw = form.get('image');

  if(name == null || typeof name !== 'string' || name.trim() === '') {
    return { error: 'Invalid name' };
  }
  if(description == null || typeof description !== 'string') {
    return { error: 'Invalid description' };
  }
  if(publicRaw != null && typeof publicRaw !== 'string') {
    return { error: 'Invalid public' };
  }
  const isPublic = !!publicRaw;

  if(publicUrl == null || typeof publicUrl !== 'string' || (isPublic && publicUrl.trim() === '')) {
    return { error: 'Invalid public URL' };
  }
  if(callbackUrlsRaw == null || typeof callbackUrlsRaw !== 'string') {
    return { error: 'Invalid redirect URLs' };
  }

  try {
    if(publicUrl) {
      const url = new URL(publicUrl);
      if(url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { error: 'Invalid public URL' };
      }
    }
  } catch {
    return { error: 'Invalid public URL' };
  }

  const callbackUrls = callbackUrlsRaw
    .split(/\r|\n/g)
    .map((url) => url.trim())
    .filter((url) => url !== '');

  try {
    callbackUrls.forEach((url) => new URL(url));
  } catch {
    return { error: 'Invalid callback URLs' };
  }

  if(imageRaw !== null && !(imageRaw instanceof Blob)) {
    return { error: 'Invalid image' };
  }

  let image: Buffer | undefined = undefined;
  try {
    if(imageRaw !== null && imageRaw.size > 0) {
      console.log(imageRaw);

      const buffer = Buffer.from(await imageRaw.arrayBuffer());

      const sharpImage = sharp(buffer);

      const resized = await sharpImage
        .resize({ width: 128, height: 128, withoutEnlargement: (await sharpImage.metadata()).format !== 'svg' })
        .toFormat('png')
        .toBuffer();

      image = resized;
    }
  } catch {
    return { error: 'Error resizing image' };
  }

  try {
    await db.application.updateMany({
      where: { ownerId: user.id, id },
      data: {
        name: name.trim(),
        description: description.trim(),
        public: !!publicRaw,
        publicUrl: publicUrl.trim(),
        callbackUrls,
        image
      }
    });
  } catch {
    return { error: 'Unknown error' };
  }

  revalidatePath(`/dev/applications/${id}`);

  return { success: 'Application saved' };
};
