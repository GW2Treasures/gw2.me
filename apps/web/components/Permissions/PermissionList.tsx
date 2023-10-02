import { FC } from 'react';
import styles from './PermissionList.module.css';

export interface PermissionListProps {
  permissions: string[];
}

export const PermissionList: FC<PermissionListProps> = ({ permissions }) => {
  return (
    <ul className={styles.list}>
      {permissions.map((permission) => (
        <li key={permission}>{permission}</li>
      ))}
    </ul>
  );
};
