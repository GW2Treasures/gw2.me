/* eslint-disable @next/next/no-img-element */
'use client';

import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { FC, useCallback, useRef, useState } from 'react';

export interface EditApplicationImageProps {
  applicationId: string;
  exists: boolean;
}

export const EditApplicationImage: FC<EditApplicationImageProps> = ({ applicationId, exists }) => {
  const img = useRef<HTMLImageElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState(false);

  const handleShowUpload = useCallback(() => {
    file.current?.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if(!file.current?.files?.[0]) {
      return;
    }

    const data = new FormData();
    data.append('id', applicationId);
    data.append('image', file.current.files[0]);

    await fetch(`/api/application/${applicationId}/image`, {
      method: 'POST',
      body: data,
    });

    file.current.value = '';
    if(img.current) {
      img.current.src = img.current.src;
    }
    setUploaded(true);
  }, [applicationId]);

  return (
    <FlexRow>
      {(exists || uploaded) && <ApplicationImage applicationId={applicationId} size={64}/>}
      <input type="file" ref={file} hidden onChange={handleUpload}/>
      <Button onClick={handleShowUpload}>Upload new image</Button>
    </FlexRow>
  );
};
