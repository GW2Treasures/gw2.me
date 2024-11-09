import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { unstable_rethrow as rethrow } from 'next/navigation';

type Action<State extends FormState> = (state: State | { error?: string }, data: FormData) => Promise<State | { error?: string }>;

export function createAction<State extends FormState>(action: Action<State>): Action<State> {
  return async function wrappedAction(state, data) {
    try {
      return await action(state, data);
    } catch(e) {
      rethrow(e);

      if(e instanceof ActionError) {
        return { error: e.message };
      }

      console.error('Error during action:');
      console.error(e);

      return { error: 'Unknown error.' };
    }
  };
}

class ActionError extends Error {}

export function error(message: string): never {
  throw new ActionError(message);
}
