import { isDefinied } from './is';
import { OAuth2ErrorCode } from './oauth/error';

type RedirectUrlSearchParamsCommon = {
  /** An opaque value used by the client to maintain state between the request and callback. */
  state?: string,
}

type RedirectUrlSearchParamsSuccess = {
  /** The authorization code generated by the authorization server. */
  code: string
}

type RedirectUrlSearchParamsError = {
  /** Error code */
  error: OAuth2ErrorCode,

  /** Human-readable ASCII [USASCII] text providing additional information, used to assist the client developer in understanding the error that occurred. */
  error_description?: string,

  /** A URI identifying a human-readable web page with information about the error, used to provide the client developer with additional information about the error. */
  error_uri?: string,
}

type RedirectUrlSearchParams =
  & RedirectUrlSearchParamsCommon
  & (RedirectUrlSearchParamsSuccess | RedirectUrlSearchParamsError)
  & Record<string, string | undefined>

/**
 * Create a new URL with additional searchParams.
 *
 * @param base The base redirect_url
 * @param searchParams The additional searchParams to append to the url
 * @returns The modified url
 */
export function createRedirectUrl(base: string | URL, searchParams: RedirectUrlSearchParams): URL {
  const url = new URL(base);

  Object.entries(searchParams)
    .filter(([, value]) => isDefinied(value))
    .forEach(([key, value]) => url.searchParams.set(key, value!));

  console.log(url.searchParams);

  return url;
}
