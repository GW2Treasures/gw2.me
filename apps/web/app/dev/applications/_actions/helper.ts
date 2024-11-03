import { ClientType } from '@gw2me/database';

export const ClientTypeOptions = [
  { value: ClientType.Confidential, label: 'Confidential (Server side applications)' },
  { value: ClientType.Public, label: 'Public (Javascript apps (SPA), native apps, mobile apps, …)' }
];
