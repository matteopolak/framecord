import { EventHandler } from '@structs/Events';
import { Handler } from '@structs/Handler';
import { embed, message } from '@util/message';
import {
	Interaction,
	InteractionType,
	ApplicationCommandType,
} from 'discord.js';

export class CommandHandler extends Handler {
	@EventHandler()
	public async interactionCreate(interaction: Interaction<'cached'>) {
		if (
			interaction.type !== InteractionType.ApplicationCommand ||
			interaction.commandType !== ApplicationCommandType.ChatInput
		)
			return;

		const subCommand = interaction.options.getSubcommand(false);
		const subCommandGroup = interaction.options.getSubcommandGroup(false);

		const root = this.client.commands.get(interaction.commandName);
		const parent = subCommandGroup
			? root?.subcommands.get(subCommandGroup)
			: root;
		const command = subCommand ? parent?.subcommands.get(subCommand) : parent;

		if (!command) return;

		const response = await command.check(interaction);

		if (!response.valid) {
			return message(
				interaction,
				embed({
					title: `Error with argument \`${response.source}\``,
					description: response.value,
				})
			);
		}

		const args = response.value;

		try {
			const response = await command.run(interaction, ...args);
			if (!response) return;

			return message(
				interaction,
				typeof response === 'string'
					? embed({ description: response })
					: response
			);
		} catch (e) {
			if (typeof e === 'string') {
				return embed({ description: e, title: 'Error' });
			}

			console.error(e);
		}
	}
}
