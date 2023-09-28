'use server';

import { db } from "@/lib/db";
import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";

export interface AddAccountActionState {
  message?: string;
}

const apiKeyRegex = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{20}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;

export async function addAccount(previousState: AddAccountActionState, payload: FormData): Promise<AddAccountActionState> {
  const user = await getUser();
  if(!user) {
    redirect('/login');
  }

  const apiKey = payload.get('api-key');

  if(apiKey === null || typeof apiKey !== 'string') {
    return { message: 'Missing API key' };
  }

  // verify format
  if(!apiKey.match(apiKeyRegex)) {
    return { message: 'Invalid Format (JWT Subtokens are not supported)' };
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  // verify token
  const response = await fetch('https://api.guildwars2.com/v2/tokeninfo', { headers });

  if(response.status !== 200) {
    return { message: 'Could not verify API key' };
  }

  const tokeninfo = await response.json();
  const account = await (await fetch('https://api.guildwars2.com/v2/account', { headers })).json();

  // check if api key is already known
  const count = await db.apiToken.count({ where: { id: tokeninfo.id }});
  if(count > 0) {
    return { message: 'API key already added' };
  }

  try {
    await db.apiToken.create({
      data: {
        id: tokeninfo.id,
        name: tokeninfo.name,
        token: apiKey,
        permissions: tokeninfo.permissions,
        user: { connect: { id: user.id }},
        account: {
          connectOrCreate: {
            where: { id: account.id },
            create: {
              id: account.id,
              name: account.name
            }
          }
        }
      }
    });
  } catch(error) {
    console.error(error);
    return { message: 'Could not save api token' };
  }

  redirect('/profile');
}
