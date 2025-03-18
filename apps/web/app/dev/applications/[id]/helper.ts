import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { cache } from 'react';

export const getApplicationById = cache(
  async (id: string, userId: string) => {
    const application = await db.application.findUnique({ where: { id, ownerId: userId }});

    if(!application) {
      notFound();
    }

    return application;
  },
);
