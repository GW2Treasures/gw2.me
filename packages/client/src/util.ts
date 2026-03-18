import { Gw2MeError } from './error.js';

export async function jsonOrError<T = unknown>(response: Response): Promise<T> {
  await okOrError(response);

  if(!isJsonResponse(response)) {
    throw new Gw2MeError('gw2.me did not return a valid JSON response');
  }

  return response.json();
}

export async function okOrError(response: Response): Promise<void> {
  if(!response.ok) {
    let errorMessage: string | undefined;

    // lets check if we can get more details
    if(isJsonResponse(response)) {
      const error = await response.json();
      errorMessage = error.error_description;
    }

    throw new Gw2MeError(`gw2.me returned an error: ${errorMessage ?? 'Unknown error'}`);
  }
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('Content-Type');

  return contentType?.split(';')[0].trim().toLowerCase() === 'application/json';
}
