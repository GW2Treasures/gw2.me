import { browserSupportsPasskeys } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';

export function useBrowserSupportsPasskeys() {
  const [supportsPasskeys, setSupportsPasskeys] = useState<boolean>();

  useEffect(() => {
    browserSupportsPasskeys().then((supported) => setSupportsPasskeys(supported));
  }, []);

  return supportsPasskeys;
}
