import type { FC } from 'react';

export const Never: FC = () => {
  return (
    <span style={{ color: 'var(--color-text-muted)' }}>never</span>
  );
};
