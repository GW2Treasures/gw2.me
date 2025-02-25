import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { FC } from 'react';
import type { Permission as Gw2Permission } from '@gw2api/types/data/tokeninfo';
import { permissionDescriptions } from './data';

export interface PermissionProps {
  permission: Gw2Permission;
}


export const Permission: FC<PermissionProps> = ({ permission }) => {
  const description = permissionDescriptions[permission];

  if(!description) {
    return permission;
  }

  return (
    <Tip tip={description}>
      <span>{permission}</span>
    </Tip>
  );
};
