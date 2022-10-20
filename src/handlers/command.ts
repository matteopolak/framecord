import { ArgumentResponse, ArgumentTypes } from '@structs/Argument';
import { EventHandler } from '@structs/Events';
import { Handler } from '@structs/Handler';
import { embed, message } from '@util/message';
import { config } from 'config';
import {
	Interaction,
	InteractionType,
	ApplicationCommandType,
} from 'discord.js';

export default class CommandHandler extends Handler {
	// Default event listener to handle commands
	@EventHandler()
	public async interactionCreate(interaction: Interaction<'cached'>) {
		// Filter out interactions that aren't slash commands
		if (
			interaction.type !== InteractionType.ApplicationCommand ||
			interaction.commandType !== ApplicationCommandType.ChatInput
		)
			return;

		// Get the (optional) subcommand
		const subCommand = interaction.options.getSubcommand(false);

		// Get the (optional) subcommand group
		const subCommandGroup = interaction.options.getSubcommandGroup(false);

		// Get the root command, which is just the command name
		const root = this.client.commands.get(interaction.commandName);

		// Get the subcommand group (for commands nested two layers deep);
		// default to the root if it doesn't exist
		const parent = subCommandGroup
			? root?.subcommands.get(subCommandGroup)
			: root;

		// Get the subcommand from the subcommand group if it exists; fall back
		// to the previous node if it doesn't exist
		const command = subCommand ? parent?.subcommands.get(subCommand) : parent;

		// Exit early if it doesn't exist
		if (!command) return;

		// Ensure the user passes all checks
		const response = await command.check(interaction);

		// If the user does not pass the checks, return an error
		if (!response.valid) {
			return message(
				interaction,
				embed({
					title:
						response.source &&
						config.messages.parameterFailure(
							response as ArgumentResponse<ArgumentTypes, boolean, false>
						),
					description: response.value,
				})
			);
		}

		// Assign the arguments to a new variable so we can shadow `response`
		const args = response.value;

		// A try-catch is used here to allow early exits (cannot be accomplished
		// as nicely with then-catch)
		try {
			// Execute the command
			const response = await command.run(interaction, ...args);

			// If the response is null, void, undefined, or an empty string
			// then exit early with no response
			if (!response) return;

			// Otherwise, send the response message
			return message(
				interaction,
				typeof response === 'string'
					? embed({ description: response })
					: response
			);
		} catch (e) {
			// If the error thrown is a string, treat it as an embed description.
			// Real errors are (almost) always some type of Error object so it won't
			// print those.
			if (typeof e === 'string') {
				return message(interaction, embed({ description: e, title: 'Error' }));
			} else {
				try {
					// Execute the fallback command
					const response = await command.catch(
						e as Error,
						interaction,
						...args
					);

					// If the response is null, void, undefined, or an empty string
					// then exit early with no response
					if (!response) return;

					// Otherwise, send the response message
					return message(
						interaction,
						typeof response === 'string'
							? embed({ description: response })
							: response
					);
				} catch (e) {
					if (typeof e === 'string') {
						return message(
							interaction,
							embed({ description: e, title: 'Error' })
						);
					}

					// Print out the real error to stderr
					console.error(e);
				}
			}
		}
	}
}
