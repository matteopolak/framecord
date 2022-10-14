import {
	ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ApplicationCommandSubCommandData,
	ApplicationCommandSubGroupData,
	Collection,
	CommandInteraction,
	PermissionsBitField,
} from 'discord.js';
import type {
	CommandArgument,
	CommandArgumentTypes,
	CommandArgumentValue,
} from '@structs/command/CommandArgument';
import Client from '@structs/BaseClient';
import { Events } from '@structs/Events';
import { SendableOptions } from '@util/message';

export type CommandResponseValue =
	| string
	| null
	| void
	| SendableOptions<CommandInteraction>;
export type CommandResponse = Promise<CommandResponseValue>;
export type CommandSource = CommandInteraction<'cached'>;

export interface CommandOptions {
	client: Client;
	name: string;
}

export interface CommandExt {
	run(source: CommandSource, ...args: CommandArgument[]): CommandResponse;
	init(): Promise<void> | void;
}

export type CommandCheckResponse =
	| {
			valid: false;
			value: string;
			source?: string;
	  }
	| {
			valid: true;
			value: CommandArgumentValue<CommandArgumentTypes, true>[];
	  };

export class Command extends Events {
	/** The name of the slash command (same as file name by default) */
	public readonly name: string;

	/**
	 * An array of command arguments, values are applied to the `run` method
	 * in the same order that they are provided here
	 */
	public readonly arguments: CommandArgument[];

	/**
	 * A `Collection` of subcommands, automatically populated when
	 * registering a command folder
	 */
	public readonly subcommands: Collection<string, Command> = new Collection();

	/** The description of the slash command */
	public readonly description: string = 'No description.';

	/** Whether the command should be enabled */
	public readonly enabled = true;

	/** The permissions required to use the slash command */
	public readonly permissions: PermissionsBitField = new PermissionsBitField();

	/** A reference to the main client */
	protected readonly client: Client;

	constructor(options: CommandOptions) {
		super();

		this.arguments = [];
		this.name = options.name;
		this.client = options.client;
	}

	/** Validates a `CommandSource` */
	async check(source: CommandSource): Promise<CommandCheckResponse> {
		if (!source.member.permissions.has(this.permissions)) {
			return {
				valid: false,
				value: 'Insufficient permissions.',
			};
		}

		const args: CommandArgumentValue[] = [];

		for (const argument of this.arguments) {
			const response = await argument.run(source);

			if (!response.valid) {
				return {
					valid: false,
					value: response.value,
					source: argument.name,
				};
			}

			if (response.value !== null) args.push(response.value);
		}

		return {
			valid: true,
			value: args,
		};
	}

	/** Executed when the slash command is used */
	async run(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		source: CommandSource,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		...args: CommandArgumentValue[]
	): CommandResponse {
		// Command body goes here
	}

	/** Initialized when the command is compiled */
	async init() {
		// Initialization code goes here
	}

	/**
	 * Returns a JSON- and Discord API-compatible object to register the
	 * command (and it's subcommands) as slash commands
	 */
	public getSlashData(): ApplicationCommandOptionData {
		const options = this.subcommands
			.filter(c => c.enabled)
			.map(c => c.getSlashData());

		if (this.enabled)
			options.push(...this.arguments.map(a => a.getSlashData()));

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return {
			type:
				this.subcommands.size > 0
					? ApplicationCommandOptionType.SubcommandGroup
					: ApplicationCommandOptionType.Subcommand,
			name: this.name,
			description: this.description ?? '\u200b',
			options: options as Exclude<
				ApplicationCommandOptionData,
				ApplicationCommandSubCommandData | ApplicationCommandSubGroupData
			>[],
		};
	}
}
