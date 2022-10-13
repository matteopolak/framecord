import { config } from 'config';
import {
	APIEmbed,
	CommandInteraction,
	InteractionReplyOptions,
	Message,
	MessageCreateOptions,
	MessageEditOptions,
	TextBasedChannel,
	User,
} from 'discord.js';

export type Sendable = CommandInteraction | User | TextBasedChannel | Message;
export type SendableOptions<T extends Sendable> = T extends CommandInteraction
	? InteractionReplyOptions
	: T extends Message
	? MessageEditOptions
	: MessageCreateOptions;

/// Creates a payload with the provided embed
export function embed(options: APIEmbed) {
	return {
		embeds: [options],
	};
}

/// Sends a payload to a sendable location, like a channel or user
export async function message<T extends Sendable>(
	channel: T,
	options: SendableOptions<T>
) {
	if (options.embeds) {
		for (const embed of options.embeds) {
			if (!('toJSON' in embed)) {
				embed.color = config.formatting.embedColour;

				if (config.formatting.padEmbedFields && embed.fields) {
					for (const field of embed.fields) {
						field.value = `${field.value}\n\u200b`;
					}
				}
			}
		}
	}

	/* eslint-disable @typescript-eslint/ban-ts-comment */

	if ('send' in channel) {
		// @ts-ignore
		channel.send(options);
	} else if ('edit' in channel) {
		// @ts-ignore
		channel.edit(options);
	} else {
		// @ts-ignore
		channel.reply(options);
	}

	/* eslint-enable @typescript-eslint/ban-ts-comment */
}
