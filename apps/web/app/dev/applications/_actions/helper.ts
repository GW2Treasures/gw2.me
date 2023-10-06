import { ApplicationType } from '@gw2me/database';

export const ApplicationTypeOptions = [
  { value: ApplicationType.Confidential, label: 'Confidential (Server side applications)' },
  { value: ApplicationType.Public, label: 'Public (Javascript apps (SPA), native apps, mobile apps, …)' }
];
