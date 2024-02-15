import { db } from './db';

const schema = '2022-03-23T19:00:00.000Z';
const userAgent = 'Mozilla/5.0 (compatible; gw2.me/1.0; +https://gw2.me)';

export function fetchGw2Api<T>(endpoint: `/v2/${string}`, apiKey?: string): Promise<T> {
  const url = new URL(endpoint, 'https://api.guildwars2.com/');

  const startTime = performance.now();

  const authorizationHeader: { Authorization: string } | {} = apiKey
    ? { 'Authorization': `Bearer ${apiKey}` }
    : {};

  return fetch(url, {
    headers: {
      'X-Schema-Version': schema,
      'User-Agent': userAgent,
      ...authorizationHeader,
    },
    redirect: 'manual',
  }).then(async (response) => {
    const endTime = performance.now();

    const isError = response.status !== 200;
    const error = isError
      ? await response.text()
      : undefined;

    await db.apiRequest.create({
      select: { id: true },
      data: {
        endpoint: url.pathname,
        queryParameters: url.search,
        apiKey,
        status: response.status,
        responseTimeMs: endTime - startTime,
        response: error
      }
    });

    if(isError) {
      throw new Error(`${url.pathname} returned ${response.status}`);
    }

    const json = response.json();

    if(Array.isArray(json) && json.length === 2 && json[0] && json[1]) {
      throw new Error(`${url.pathname} returned an invalid response.`);
    }

    return json;
  });
}
