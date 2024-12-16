import { handleTokenRequest } from './token';
import { handleOptionsRequest, handleRequest } from '../request';

export const dynamic = 'force-dynamic';

export const POST = handleRequest(handleTokenRequest);

export const OPTIONS = handleOptionsRequest();
