'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { Prisma } from '@gw2me/database';
import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { getFormDataString } from '@/lib/form-data';

export async function editApplication(id: string, _: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  // get the existing application and verify ownership
  const application = await db.application.findUnique({
    where: { id, ownerId: session.userId }
  });

  if(!application) {
    return { error: 'Application not found' };
  }

  // get form data
  const name = getFormDataString(form, 'name');
  const description = getFormDataString(form, 'description');
  const email = getFormDataString(form, 'email');
  const publicRaw = getFormDataString(form, 'public');
  const publicUrl = getFormDataString(form, 'publicUrl');
  const privacyPolicyUrl = getFormDataString(form, 'privacyPolicyUrl');
  const termsOfServiceUrl = getFormDataString(form, 'termsOfServiceUrl');
  const callbackUrlsRaw = getFormDataString(form, 'callbackUrls');
  const imageRaw = form.get('image');

  if(!name) {
    return { error: 'Invalid name' };
  }
  if(description === undefined) {
    return { error: 'Invalid description' };
  }
  if(!email) {
    return { error: 'Invalid email' };
  }

  const isPublic = !!publicRaw;

  if(publicUrl === undefined || (isPublic && (publicUrl === '' || !isValidUrl(publicUrl)))) {
    return { error: 'Invalid public URL' };
  }

  if(privacyPolicyUrl === undefined || (privacyPolicyUrl && !isValidUrl(privacyPolicyUrl))) {
    return { error: 'Invalid Privacy Policy URL' };
  }
  if(termsOfServiceUrl === undefined || (termsOfServiceUrl && !isValidUrl(termsOfServiceUrl))) {
    return { error: 'Invalid Terms of Service URL' };
  }

  if(callbackUrlsRaw === undefined) {
    return { error: 'Invalid redirect URLs' };
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
        name,
        description,
        emailId: email,
        public: !!publicRaw,
        publicUrl,
        privacyPolicyUrl,
        termsOfServiceUrl,
        callbackUrls,
        imageId,
      }
    });
  } catch(e) {
    if(e instanceof Prisma.PrismaClientKnownRequestError) {
      // unique constraint failed - https://www.prisma.io/docs/orm/reference/error-reference#p2002
      if(e.code === 'P2002') {
        return { error: 'Name already in use' };
      }
    }

    console.error(e);
    return { error: 'Unknown error' };
  }

  revalidatePath(`/dev/applications/${id}`);

  return { success: 'Application saved' };
}

function isValidUrl(urlString: string): boolean {
  try {
    // try parsing as url
    const url = new URL(urlString);

    // only allow http and https urls
    if(url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
