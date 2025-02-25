import { Permission } from '@gw2api/types/data/tokeninfo';

export const permissionDescriptions: Record<Permission, string> = {
  'account': 'Your account display name, ID, home world, and list of guilds.',
  'inventories': 'Your account bank, material storage, recipe unlocks, and character inventories.',
  'characters': 'Basic information about your characters.',
  'tradingpost': 'Your Trading Post transactions.',
  'wallet': 'Your account\'s wallet.',
  'unlocks': 'Your wardrobe unlocks—skins, dyes, minipets, finishers, etc.—and currently equipped skins.',
  'pvp': 'Your PvP stats, match history, reward track progression, and custom arena details.',
  'wvw': 'Your selected WvW guild, assigned team, and personal WvW information.',
  'builds': 'Your currently equipped specializations, traits, skills, and equipment for all game modes.',
  'progression': 'Your achievements, dungeon unlock status, mastery point assignments, and general PvE progress.',
  'guilds': 'Guilds\' rosters, history, and MOTDs for all guilds you are a member of.',
};


export const allPermissions = Object.keys(permissionDescriptions) as Permission[];
