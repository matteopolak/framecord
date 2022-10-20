import { ArgumentResponse, ArgumentTypes } from '@structs/Argument';
import { CommandSource } from '@structs/Command';
import { formatListing } from '@util/message';
import { PermissionsBitField } from 'discord.js';

export const config = {
	/** Formatting options for messages sent from the client */
	formatting: {
		padFields: true,
		colour: 0xffffff,
	},
	messages: {
		parameterFailure: (
			response: ArgumentResponse<ArgumentTypes, boolean, false>
		) => `Error with parameter \`${response.source}\``,
		insufficientPermissions: (_: CommandSource, need: PermissionsBitField) =>
			`You need ${formatListing(
				need.toArray(),
				p => `\`${p}\``
			)} in order to run this command.`,
	},
};
