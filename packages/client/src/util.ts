import { Gw2MeError } from './error';

export async function jsonOrError(response: Response) {
  const isJson = response.headers.get('Content-Type') === 'application/json';

  if(!response.ok) {
    let errorMessage: string | undefined;

    // lets check if we can get more details
    if(isJson) {
      const error = await response.json();

      errorMessage = error.error_description;
    }

    throw new Gw2MeError(`gw2.me returned an error: ${errorMessage ?? 'Unknown error'}`);
  }

  if(!isJson) {
    throw new Gw2MeError('gw2.me did not return a valid JSON response');
  }

  return response.json();
}
