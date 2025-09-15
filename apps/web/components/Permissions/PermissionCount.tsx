import { Permission } from '@gw2api/types/data/tokeninfo';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import type { FC } from 'react';
import styles from './PermissionCount.module.css';
import { allPermissions } from './data';
import { Icon } from '@gw2treasures/ui';

export interface PermissionCountProps {
  permissions: Permission[],
}

export const PermissionCount: FC<PermissionCountProps> = ({ permissions }) => {
  const hasAll = permissions.length === allPermissions.length;

  const permissionTip = (
    <ul className={styles.permissionList}>
      {allPermissions.map((permission) => {
        const hasPermission = permissions.includes(permission);

        return (
          <li key={permission} className={hasPermission ? styles.permission : styles.permissionMissing}>
            <Icon icon={hasPermission ? 'checkmark' : 'cancel'}/> {permission}
          </li>
        );
      })}
    </ul>
  );

  return (
    <Tip tip={permissionTip}>
      <span className={hasAll ? styles.badgeAll : styles.badge}>
        {hasAll ? <><Icon icon="checkmark"/> All permissions</> : `${permissions.length}/${allPermissions.length} permissions`}
      </span>
    </Tip>
  );
};
