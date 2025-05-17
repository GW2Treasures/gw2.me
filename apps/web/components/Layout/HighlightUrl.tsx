import { useMemo, type FC } from 'react';
import { Code } from './Code';
import styles from './HighlightUrl.module.css';

export interface HighlightUrlProps {
  url: string | URL,
  highlight?: string | string[],
}

export const HighlightUrl: FC<HighlightUrlProps> = ({ url: input, highlight }) => {
  // parse url
  const url = useMemo(() => input instanceof URL ? input : new URL(input), [input]);

  return (
    <Code>
      <span>
        {url.href.slice(0, url.href.length - url.search.length - url.pathname.length)}
      </span>
      <span className="pl-en">
        {url.pathname}
      </span>
      {Array.from(url.searchParams).map(([key, value], index) => (
        <div key={key} className={(Array.isArray(highlight) ? highlight.includes(key) : key === highlight) ? styles.highlight : styles.q}>
          <span className="pl-c">{index === 0 ? '?' : '&'}</span>
          <span className="pl-ent">{encodeURIComponent(key)}</span>
          <span>=</span>
          <span className="pl-s">{encodeURIComponent(value)}</span>
        </div>
      ))}
    </Code>
  );
};
