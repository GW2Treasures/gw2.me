import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

export async function editApplication(id: string, _: FormState, form: FormData): Promise<FormState> {
  'use server';

  // get user
  const user = await getUser();
  if(!user) {
    return { error: 'Not logged in' };
  }

  // get the existing application and verify ownership
  const application = await db.application.findUnique({
    where: { id, ownerId: user.id }
  });

  if(!application) {
    return { error: 'Application not found' };
  }

  // get form data
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

  // verify publicUrl
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

  // verify callbackUrls
  let callbackUrls: string[];
  try {
    callbackUrls = callbackUrlsRaw
      .split(/\r|\n/g)
      .map((url) => url.trim())
      .filter((url) => url !== '')
      .map((url) => {
        const u = new URL(url);

        // ignore port for loopback ips (see https://datatracker.ietf.org/doc/html/rfc8252#section-7.3)
        if(u.hostname === '127.0.0.1' || u.hostname === '[::1]') {
          u.port = '';
        }

        return u.toString();
    });
  } catch {
    return { error: 'Invalid callback URLs' };
  }

  // make sure imageRaw is a file
  if(imageRaw !== null && !(imageRaw instanceof Blob)) {
    return { error: 'Invalid image' };
  }

  let imageId: string | undefined;
  try {
    if(imageRaw !== null && imageRaw.size > 0) {
      // get source image buffer
      const buffer = Buffer.from(await imageRaw.arrayBuffer());

      // get sharp instance and metadata
      const sharpImage = sharp(buffer);
      const metadata = await sharpImage.metadata();

      // resize image
      const resized = await sharpImage
        .resize({ width: 128, height: 128, withoutEnlargement: metadata.format !== 'svg' })
        .toFormat('png')
        .toBuffer();

      // get hash
      const sha256 = createHash('sha256').update(resized).digest('hex');

      // create file if hash doesn't exist yet
      const image = await db.file.upsert({
        where: { sha256 },
        create: { data: resized, sha256, type: 'image/png' },
        update: {}
      });

      imageId = image.id;

      // delete old image if it exists (and it actually changed)
      if(application.imageId !== null && application.imageId !== imageId) {

        // only delete if no other application is using this image
        await db.file.deleteMany({
          where: { id: application.imageId, applicationImage: { every: { id }}}
        });
      }
    }
  } catch {
    return { error: 'Error resizing image' };
  }

  try {
    await db.application.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        public: !!publicRaw,
        publicUrl: publicUrl.trim(),
        callbackUrls,
        imageId,
      }
    });
  } catch {
    return { error: 'Unknown error' };
  }

  revalidatePath(`/dev/applications/${id}`);

  return { success: 'Application saved' };
};
