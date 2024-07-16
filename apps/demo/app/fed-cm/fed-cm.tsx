'use client';

import { Gw2MeClient } from '@gw2me/client';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';

export interface FedCmProps {
  clientId: string;
  gw2meUrl: string;
}

export const FedCm: FC<FedCmProps> = ({ clientId, gw2meUrl }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supportsFedCmMode, setSupportsFedCmMode] = useState(false);
  const [abort, setAbort] = useState<AbortController>();
  const [error, setError] = useState<string>();
  const [mediation, setMediation] = useState<CredentialMediationRequirement>('optional');
  const [mode, setMode] = useState<undefined | 'button'>();
  const gw2me = useMemo(() => new Gw2MeClient({ client_id: clientId }, { url: gw2meUrl }), [clientId, gw2meUrl]);

  // check if this browser supports mode=button
  useEffect(() => {
    let supportsFedCmMode = false;
    try {
      navigator.credentials.get({
        identity: Object.defineProperty(
          {}, 'mode', {
            get () { supportsFedCmMode = true; }
          }
        )
      } as any).catch(() => {});
    } catch(e) {}

    setSupportsFedCmMode(supportsFedCmMode);
    setLoading(false);
  }, []);

  // trigger FedCM
  const handleClick = useCallback(() => {
    if(abort !== undefined) {
      abort.abort();
    }

    const abortController = new AbortController();
    setAbort(abortController);
    setError(undefined);

    gw2me.fedCM.request({ mode, mediation, signal: abortController.signal }).then((credential) => {
      setAbort(undefined);
      credential && router.push(`/callback?code=${credential.token}`);
    }).catch((e) => {
      if(!(e instanceof DOMException && e.name === 'AbortError')) {
        setAbort(undefined);
        setError(e.toString());
      }
    });
  }, [abort, gw2me.fedCM, mediation, mode, router]);

  if(loading || !gw2me.fedCM.isSupported()) {
    return (
      <Notice type="error">Your browser does not support FedCM.</Notice>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--color-border)', padding: 16, borderRadius: 2, background: 'var(--color-background-light)' }}>
      <Label label="Mediation">
        <Select options={['required', 'optional', 'silent'].map((m) => ({ label: m, value: m }))} value={mediation} onChange={setMediation as any}/>
      </Label>

      <Label label="Mode">
        <Checkbox checked={mode === 'button'} onChange={(checked) => setMode(checked ? 'button' : undefined)} disabled={!supportsFedCmMode}>button</Checkbox>
      </Label>

      <FlexRow>
        <Button onClick={handleClick} icon="gw2me">Trigger FedCM</Button>
        {abort && (<Button onClick={() => { abort.abort(); setAbort(undefined); }}>Cancel</Button>)}
      </FlexRow>

      {error && (
        <div style={{ color: 'var(--color-error)' }}>
          {error}
          <div style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>Check the browser console for more details.</div>
        </div>
      )}
    </div>
  );
};

