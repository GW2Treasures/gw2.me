/* eslint-disable @next/next/no-img-element */
import { FC } from 'react';
import styles from './ApplicationImage.module.css';
import placeholder from './app-placeholder.png';

export interface ApplicationImageProps {
  fileId: string | null;
  size?: number;
}

export const ApplicationImage: FC<ApplicationImageProps> = ({ fileId, size = 32 }) => {
  return (
    <img
      className={styles.image}
      src={fileId ? `/api/file/${fileId}` : placeholder.src}
      width={size} height={size}
      alt=""
      crossOrigin="anonymous" referrerPolicy="no-referrer" loading="lazy"/>
  );
};
