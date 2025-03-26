import { handleParRequest } from './par';
import { handleOptionsRequest, handleRequest } from '../../../api/(oauth)/request';

export const dynamic = 'force-dynamic';

export const POST = handleRequest(handleParRequest);

export const OPTIONS = handleOptionsRequest();
