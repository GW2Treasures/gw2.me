export enum Scope {
  Identify = 'identify',
  Email = 'email',

  Accounts = 'accounts',
  Accounts_Verified = 'accounts.verified',
  Accounts_DisplayName = 'accounts.displayName',

  GW2_Account = 'gw2:account',
  GW2_Inventories = 'gw2:inventories',
  GW2_Characters = 'gw2:characters',
  GW2_Tradingpost = 'gw2:tradingpost',
  GW2_Wallet = 'gw2:wallet',
  GW2_Unlocks = 'gw2:unlocks',
  GW2_Pvp = 'gw2:pvp',
  GW2_Builds = 'gw2:builds',
  GW2_Progression = 'gw2:progression',
  GW2_Guilds = 'gw2:guilds',
}

export interface ClientInfo {
  client_id: string;
  client_secret?: string;
}

export interface Options {
  url: string;
}
