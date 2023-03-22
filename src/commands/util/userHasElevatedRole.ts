import { GuildMember, PermissionsBitField } from 'discord.js';

import { config } from '../../util/Container';

const userHasElevatedRole = (member: Nullable<GuildMember>) => {
  if (!member) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

  return member.roles.cache.some(role => config.elevatedRoles.includes(role.name));
};

export default userHasElevatedRole;
