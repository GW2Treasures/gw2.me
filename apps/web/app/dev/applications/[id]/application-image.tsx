/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC, useCallback, useRef, useState } from 'react';

export interface ApplicationImageProps {
  applicationId: string;
  exists: boolean;
}

export const ApplicationImage: FC<ApplicationImageProps> = ({ applicationId, exists }) => {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {(exists || uploaded) && <img ref={img} width={64} height={64} src={`/api/application/${applicationId}/image`} alt="" style={{ borderRadius: 2 }}/>}
      <input type="file" ref={file} hidden onChange={handleUpload}/>
      <Button onClick={handleShowUpload}>Upload new image</Button>
    </div>
  );
};
