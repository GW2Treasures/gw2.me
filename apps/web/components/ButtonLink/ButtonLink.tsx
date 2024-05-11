import { FC, ReactNode } from 'react';
import styles from './ButtonLink.module.css';

interface ButtonLinkProps {
  children: ReactNode;
  onClick: () => void;
};

export const ButtonLink: FC<ButtonLinkProps> = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className={styles.button}>{children}</button>
  );
};
