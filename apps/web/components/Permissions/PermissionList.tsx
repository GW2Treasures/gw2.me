import { FC } from 'react';
import styles from './PermissionList.module.css';
import { Permission } from './Permission';

export interface PermissionListProps {
  permissions: string[];
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
