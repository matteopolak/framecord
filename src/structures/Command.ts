import {
	ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ApplicationCommandSubCommandData,
	ApplicationCommandSubGroupData,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Collection,
	CommandInteraction,
	PermissionsBitField,
} from 'discord.js';
import { Argument, ArgumentType } from '@structs/Argument';
import Client from '@structs/BaseClient';
import { Events } from '@structs/Events';
import { SendableOptions } from '@util/message';
import { config } from 'config';

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
	default: boolean;
	parent?: Command;
}

export type CommandCheckResponse =
	| {
		valid: false;
		value: string;
		source?: string;
	}
	| {
		valid: true;
		value: unknown[];
	};

/**
 * The base command to extend from.
 *
 * @example
 * ```typescript
 * class BanUser extends Command {
 *   constructor(options: CommandOptions) {
 *     super(options);
 *
 *     // The name of the command
 *     this.name = 'ban';
 *     // A description of the command
 *     this.description = 'Bans a user from the server';
 *
 *     this.arguments.push(
 *       new Argument({
 *         // The type of argument
 *         type: ArgumentType.User,
 *         // The name of the argument
 *         name: 'user',
 *         // A description of the argument
 *         description: 'The user to ban from the server',
 *         // The (optional) filter that the argument must pass
 *         filter: (source, user) => source.user.id !== user.id,
 *         // The error shown to the user if the filter is not passed
 *         error: 'You cannot ban yourself',
 *       }),
 *       new Argument({
 *         type: ArgumentType.String,
 *         name: 'reason',
 *         description: 'The reason for the punishment',
 *         // Specific property for `ArgumentType.String`
 *         maxLength: 128,
 *         // Whether the argument is required
 *         required: false,
 *       })
 *     );
 *   }
 *
 *   // The first argument is the source of the command (i.e. a `CommandInteraction`).
 *   // Remaining arguments are passed in the same order as they are provided in Command#arguments.
 *   public async run(source: CommandSource, user: User, reason?: string) {
 *     try {
 *       await source.guild.members.ban(user, { reason });
 *
 *       return `**${escapeMarkdown(user.tag)}** has been banned.`;
 *     } catch {
 *       throw `${user} could not be banned.`;
 *     }
 *   }
 * }
 * ```
 */
export class Command extends Events {
	/** The name of the slash command (same as file name by default) */
	public name: string;

	/**
	 * An array of command arguments, values are applied to the `run` method
	 * in the same order that they are provided here
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public readonly arguments: Argument<ArgumentType, boolean, any>[];

	/**
	 * A `Collection` of subcommands, automatically populated when
	 * registering a command folder
	 */
	public readonly subcommands: Collection<string, Command> = new Collection();

	/** The description of the slash command */
	public description = 'No description.';

	/** Whether the command should be enabled */
	public enabled = true;

	/** The permissions required to use the slash command */
	public readonly permissions: PermissionsBitField = new PermissionsBitField();

	/** A reference to the main client */
	protected readonly client: Client;

	/** Whether the command exists or if it is merely a container for its children */
	public readonly default: boolean;

	/** The parent of the command */
	public readonly parent?: Command;

	/** The full string of the command path */
	private _path?: string;

	/** An array of command names for the path */
	private _pathParts?: string[];

	constructor(options: CommandOptions) {
		super();

		this.arguments = [];
		this.name = options.name;
		this.client = options.client;
		this.default = options.default;
		this.parent = options.parent;
	}

	/** Validates a `CommandSource` */
	async check(source: CommandSource): Promise<CommandCheckResponse> {
		if (!source.member.permissions.has(this.permissions)) {
			return {
				valid: false,
				value: config.messages.insufficientPermissions(
					source,
					new PermissionsBitField(
						(source.member.permissions.bitfield & this.permissions.bitfield) ^
						this.permissions.bitfield
					)
				),
			};
		}

		const args: unknown[] = [];
		let nextIndex = 0;

		for (const [index, argument] of this.arguments.entries()) {
			const response = await argument.run(source, args, index);

			if (!response.valid) {
				return response;
			}

			args[response.applyTo === index ? nextIndex++ : response.applyTo] =
				response.value;
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
		...args: unknown[]
	): CommandResponse {
		// Command body goes here
	}

	/** Executed if the `run` method throws an error */
	async catch(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		error: Error,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		source: CommandSource,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		...args: unknown[]
	): CommandResponse {
		// Command catch body goes here
	}

	/** Initialized when the command is compiled */
	async init() {
		// Initialization code goes here
	}

	/** Constructs and returns the parts of the absolute path to the command */
	public get pathParts(): string[] {
		if (this._pathParts) return this._pathParts;

		const parts = this.parent
			? this.parent.pathParts.concat(this.name)
			: [this.name];

		return (this._pathParts = parts);
	}

	/** Constructs and returns the absolute path to the command */
	public get path() {
		if (this._path) return this._path;

		return (this._path = this.pathParts.join(' '));
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

	/** Checks if the given Interaction points to this command. */
	public is(interaction: AutocompleteInteraction | ChatInputCommandInteraction): boolean {
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

		return this === command;
	}
}
