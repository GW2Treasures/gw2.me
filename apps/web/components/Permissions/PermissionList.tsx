import { FC } from 'react';
import styles from './PermissionList.module.css';
import { Permission } from './Permission';
import type { Permission as Gw2Permission } from '@gw2api/types/data/tokeninfo';

export interface PermissionListProps {
  permissions: Gw2Permission[];
}

export const PermissionList: FC<PermissionListProps> = ({ permissions }) => {
  return (
    <ul className={styles.list}>
      {permissions.map((permission) => (
        <li key={permission}><Permission permission={permission}/></li>
      ))}
    </ul>
  );
};
