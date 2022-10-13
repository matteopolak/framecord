import { EventHandler } from '@structs/Events';
import { Handler } from '@structs/Handler';
import {
	Interaction,
	CacheType,
	InteractionType,
	ApplicationCommandType,
} from 'discord.js';

export class CommandHandler extends Handler {
	@EventHandler()
	async interactionCreate(interaction: Interaction<CacheType>) {
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
	}
}
