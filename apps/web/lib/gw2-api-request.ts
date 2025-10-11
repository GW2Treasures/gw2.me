import { FetchOptions, Gw2ApiError, fetchGw2Api as fetch } from '@gw2api/fetch';
import { db } from './db';
import { AuthenticatedOptions, EndpointType, KnownEndpoint, OptionsByEndpoint } from '@gw2api/types/endpoints';

const schema = '2022-03-23T19:00:00.000Z';
type Schema = typeof schema;

// TODO: use custom userAgent
// const userAgent = 'Mozilla/5.0 (compatible; gw2.me/1.0; +https://gw2.me)';
const fetchOptions: FetchOptions = {};

export async function fetchGw2Api<Url extends KnownEndpoint | (string & {})>(endpoint: Url, options: OptionsByEndpoint<Url>): Promise<EndpointType<Url, Schema>> {
  const url = new URL(endpoint, 'https://api.guildwars2.com/');

  const startTime = performance.now();

  let response;
  try {
    console.log(`> ${endpoint}`, options);
    response = await fetch<Url, Schema>(endpoint, { schema, ...options, ...fetchOptions });

    if(Array.isArray(response) && response.length === 2 && response[0] === 'v1' && response[1] === 'v2') {
      throw new Error(`${endpoint} returned an invalid response (["v1","v2"]).`);
    }
  } catch(error) {
    console.error(error);

    const status = error instanceof Gw2ApiError
      ? error.response.status
      : -1;

    const endTime = performance.now();

    await db.apiRequest.create({
      select: { id: true },
      data: {
        endpoint: url.pathname,
        queryParameters: url.search,
        apiKey: getAccessTokenFromOptions(options),
        status,
        responseTimeMs: endTime - startTime,
        response: `${error}`
      }
    });

    throw error;
  }

  const endTime = performance.now();

  await db.apiRequest.create({
    select: { id: true },
    data: {
      endpoint: url.pathname,
      queryParameters: url.search,
      apiKey: getAccessTokenFromOptions(options),
      status: 200,
      responseTimeMs: endTime - startTime,
    }
  });

  return response;
}

function getAccessTokenFromOptions(options: AuthenticatedOptions | Record<never, never>): string | undefined {
  if('accessToken' in options) {
    return options.accessToken;
  }

  return undefined;
}
