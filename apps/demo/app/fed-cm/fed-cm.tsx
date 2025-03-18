'use client';

import { Gw2MeClient, Scope } from '@gw2me/client';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { useRouter } from 'next/navigation';
import { startTransition, useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
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
  const [mode, setMode] = useState<'passive' | 'active'>();
  const gw2me = useMemo(() => new Gw2MeClient({ client_id: clientId }, { url: gw2meUrl }), [clientId, gw2meUrl]);

  useEffect(() => {
    setLoading(false);

    // check if this browser supports mode=button
    try {
      navigator.credentials.get({
        identity: Object.defineProperty(
          {}, 'mode', {
            get () { startTransition(() => { setSupportsFedCmMode(true); }); }
          }
        )
      } as CredentialRequestOptions).catch(() => {});
    } catch {
      // empty on purpose
    }
  }, []);

  // trigger FedCM
  const handleClick = useCallback(() => {
    if(abort !== undefined) {
      abort.abort();
    }

    const abortController = new AbortController();
    setAbort(abortController);
    setError(undefined);

    gw2me.fedCM.request({ mode, mediation, signal: abortController.signal, scopes: [Scope.Identify, Scope.Email] }).then((credential) => {
      setAbort(undefined);

      if(credential) {
        // need to append `iss` as well because /callback does issuer verification
        router.push(`/callback?code=${credential.token}&iss=${encodeURIComponent(new URL(gw2meUrl).origin)}`);
      }
    }).catch((e) => {
      if(!(e instanceof DOMException && e.name === 'AbortError')) {
        setAbort(undefined);
        setError(e.toString());
      }
    });
  }, [abort, gw2me.fedCM, gw2meUrl, mediation, mode, router]);

  if(loading || !gw2me.fedCM.isSupported()) {
    return (
      <Notice type="error">Your browser does not support FedCM.</Notice>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--color-border)', padding: 16, borderRadius: 2, background: 'var(--color-background-light)' }}>
      <Label label="Mediation">
        <Select options={['required', 'optional', 'silent'].map((m) => ({ label: m, value: m }))} value={mediation} onChange={setMediation as (value: string) => void}/>
      </Label>

      {supportsFedCmMode && (
        <Label label="Mode">
          <Select options={['passive', 'active'].map((m) => ({ label: m, value: m }))} value={mode} onChange={setMode as (value: string) => void}/>
        </Label>
      )}

      <FlexRow>
        <Button onClick={handleClick} icon={abort ? 'loading' : 'gw2me'}>Trigger FedCM</Button>
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

