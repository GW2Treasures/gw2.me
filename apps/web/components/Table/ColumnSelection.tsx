import type { DataTableColumnSelectionProps } from '@gw2treasures/ui/components/Table/DataTable';
import type { FC, ReactNode } from 'react';

export interface ColumnSelectionProps {
  table: { ColumnSelection: FC<DataTableColumnSelectionProps> },
  children?: ReactNode,
}

export const ColumnSelection: FC<ColumnSelectionProps> = ({ table: { ColumnSelection }, children }) => {
  return (
    <ColumnSelection reset="Reset columns">{children ?? 'Columns'}</ColumnSelection>
  );
};
