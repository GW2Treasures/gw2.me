'use client';

import { PageLayout } from '@/components/Layout/PageLayout';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageLayout>
      <Headline id="error">Something went wrong!</Headline>
      <Button onClick={() => reset()}>Try again</Button>
    </PageLayout>
  );
}
