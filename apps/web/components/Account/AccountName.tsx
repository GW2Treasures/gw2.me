import { Icon, type IconProp } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { FC } from 'react';

interface AccountNameProps {
  accountName: string,
  displayName?: string | null,
  icon?: IconProp | null,
}

export const AccountName: FC<AccountNameProps> = ({ accountName, displayName, icon = 'user' }) => {
  return (
    <FlexRow>
      {icon !== null && <Icon icon={icon}/>}
      <div>
        <div>{displayName ?? accountName}</div>
        {displayName && (<div style={{ color: 'var(--color-text-muted)', lineHeight: 1 }}>{accountName}</div>)}
      </div>
    </FlexRow>
  );
};
