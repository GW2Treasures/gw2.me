import { Gw2MeError } from './error.js';

export async function jsonOrError(response: Response) {
  await okOrError(response);

  const isJson = response.headers.get('Content-Type') === 'application/json';

  if(!isJson) {
    throw new Gw2MeError('gw2.me did not return a valid JSON response');
  }

  return response.json();
}

export async function okOrError(response: Response) {
  if(!response.ok) {
    let errorMessage: string | undefined;

    // lets check if we can get more details
    const isJson = response.headers.get('Content-Type') === 'application/json';

    if(isJson) {
      const error = await response.json();
      errorMessage = error.error_description;
    }

    throw new Gw2MeError(`gw2.me returned an error: ${errorMessage ?? 'Unknown error'}`);
  }
}
