import { FC, useCallback } from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  readOnly?: boolean;
}

export const Textarea: FC<TextareaProps> = ({ value, onChange, defaultValue, placeholder, name, readOnly }) => {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  return <textarea className={styles.textarea} value={value} defaultValue={defaultValue} onChange={onChange && handleChange} placeholder={placeholder} name={name} readOnly={readOnly}/>;
};
