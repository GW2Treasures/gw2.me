/* eslint-disable @next/next/no-img-element */
import { FC } from 'react';
import styles from './ApplicationImage.module.css';

export interface ApplicationImageProps {
  applicationId: string;
  size?: number;
}

export const ApplicationImage: FC<ApplicationImageProps> = ({ applicationId, size = 32 }) => {
  return (
    <img src={`/api/application/${applicationId}/image`} width={size} height={size} alt="" className={styles.image}/>
  );
};
