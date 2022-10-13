import { Collection, CommandInteraction } from 'discord.js';
import type {
	CommandArgument,
	CommandArgumentTypes,
	CommandArgumentValue,
} from '@structs/command/CommandArgument';
import Client from '@structs/BaseClient';
import { Events } from '@structs/Events';

export type CommandResponseValue = string | null | void;
export type CommandResponse =
	| Promise<CommandResponseValue>
	| CommandResponseValue;
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
	  }
	| {
			valid: true;
			value: CommandArgumentValue<CommandArgumentTypes, false>[];
	  };

export class Command extends Events {
	public readonly id: string;
	public readonly alias: Set<string> = new Set();
	public readonly arguments: CommandArgument[];
	public readonly subcommands: Collection<string, Command> = new Collection();
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
		const args: CommandArgumentValue<CommandArgumentTypes, false>[] = [];

		for (const argument of this.arguments) {
			const response = await argument.run(source);

			if (!response.valid) {
				return response;
			}

			args.push(response.value);
		}

		return {
			valid: true,
			value: args,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	run(source: CommandSource, ...args: CommandArgument[]): CommandResponse {
		// Command body goes here
	}

	init() {
		// Initialization code goes here
	}
}
