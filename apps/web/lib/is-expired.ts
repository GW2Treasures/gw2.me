import { useEffect, useState } from 'react';

export function useIsExpired(expiresAt: Date) {
  const [expired, setExpired] = useState(isExpired(expiresAt));

  useEffect(() => {
    if(expired && !isExpired(expiresAt)) {
      setExpired(false);
    }

    if(!expired) {
      const expiresInMs = expiresAt.valueOf() - new Date().valueOf();

      const timeout = setTimeout(() => {
        setExpired(true);
      }, expiresInMs);

      return () => clearTimeout(timeout);
    }
  }, [expired, expiresAt]);

  return expired;
}

function isExpired(expiresAt: Date) {
  return expiresAt < new Date();
}
