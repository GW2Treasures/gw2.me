import { fetchGw2Api } from '@/lib/gw2-api-request';
import { unstable_cache } from 'next/cache';

// get item from gw2 api to display for challenge
// TODO: in the future we need to load all languages to show item in correct language.
//       maybe replace this with a gw2treasures.com endpoint to load just icon and names in a single request.
export const getItem = unstable_cache(
  (itemId: number) => fetchGw2Api<{ name: string, icon: string }>(`/v2/items/${itemId}`),
  ['get-item'],
  { revalidate: 600 }
);
