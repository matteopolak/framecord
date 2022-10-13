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
	id: string;
}

export interface CommandExt {
	run(source: CommandSource, ...args: CommandArgument[]): CommandResponse;
	init(): Promise<void> | void;
}

export type CommandCheckResponse =
	| {
			valid: false;
			value: string;
			source: string;
	  }
	| {
			valid: true;
			value: CommandArgumentValue<CommandArgumentTypes, true>[];
	  };

export class Command extends Events {
	public readonly id: string;
	public readonly alias: Set<string> = new Set();
	public readonly arguments: CommandArgument[];
	public readonly subcommands: Collection<string, Command> = new Collection();
	public readonly description: string = 'No description.';
	public readonly enabled = true;
	public readonly permissions: PermissionsBitField = new PermissionsBitField();

	protected readonly client: Client;

	constructor(options: CommandOptions) {
		super();

		this.arguments = [];
		this.id = options.id;
		this.client = options.client;

		// add the command id as an alias
		this.alias.add(this.id);
	}

	async check(source: CommandSource): Promise<CommandCheckResponse> {
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

	async run(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		source: CommandSource,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		...args: CommandArgumentValue[]
	): CommandResponse {
		// Command body goes here
	}

	init() {
		// Initialization code goes here
	}

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
			name: this.id,
			description: this.description ?? '\u200b',
			options: options as Exclude<
				ApplicationCommandOptionData,
				ApplicationCommandSubCommandData | ApplicationCommandSubGroupData
			>[],
		};
	}
}
