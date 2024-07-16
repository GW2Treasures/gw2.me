import { getGw2MeUrl } from '@/lib/client';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import Link from 'next/link';
import { FedCm } from './fed-cm';

export default function FedCMPage() {
  return (
    <div>
      <Headline id="fed-cm">Federated Credential Management (FedCM)</Headline>

      <p>This page is a demo to try FedCM. You can read more about FedCM in the <Link href={new URL('/dev/docs/fed-cm', getGw2MeUrl()).toString()}>FedCM Developer Documentation.</Link></p>

      <FedCm clientId={process.env.DEMO_CLIENT_ID!} gw2meUrl={getGw2MeUrl()}/>
    </div>
  );
}

export const metadata = {
  title: 'FedCM'
};
