import { cx } from '@gw2treasures/ui';
import { FC, ReactNode } from 'react';
import styles from './PageTitle.module.css';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

export const PageTitle: FC<PageTitleProps> = ({ children, className }) => {

  return (
    <h1 className={cx(styles.title, className)}>{children}</h1>
  );
};
