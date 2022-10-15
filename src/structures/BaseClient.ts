import {
	ApplicationCommandData,
	ApplicationCommandType,
	Client,
	ClientEvents,
	ClientOptions,
	Collection,
} from 'discord.js';
import { Command } from '@structs/command/Command';
import { join } from 'node:path';
import { traverse } from '@util/fs';
import { Handler } from '@structs/Handler';
import CommandHandler from '@handlers/command';
import ReadyHandler from '@handlers/ready';

export interface BaseOptions {
	publishCommandsOnReady?: boolean;
	verbose?: boolean;
}

export interface Flags {
	commandsRegistered: boolean;
}

export type BaseClientOptions = ClientOptions & BaseOptions;

/**
 * The main client.
 *
 * @example
 * ```typescript
 * const client = new Client({
 *   intents: [IntentsBitField.Flags.Guilds],
 * });
 *
 * await client.compileCommandDirectory(join(__dirname, 'commands'));
 * await client.compileHandlerDirectory(join(__dirname, 'handlers'));
 *
 * await client.init();
 *
 * client.login(process.env.TOKEN);
 * ```
 */
export default class BaseClient extends Client {
	/** A `Collection` of all commands */
	public commands: Collection<string, Command> = new Collection();

	/** The settings provided to the client */
	public settings: BaseOptions;

	/** Whether the client has been initialized */
	public initialized = false;

	/** Internal flags to ensure certain methods aren't run multiple times */
	private flags: Partial<Flags> = {};

	constructor(options: BaseClientOptions) {
		super(options);

		this.settings = options;
	}

	/** Registers the event handlers in a command or handler */
	private compileCommandEvents<T extends Command | Handler>(object: T) {
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(object));

		for (const method of methods) {
			// eslint-disable-next-line @typescript-eslint/ban-types
			const fn =
				// eslint-disable-next-line @typescript-eslint/ban-types
				object[method as keyof T] as Function;

			if ('event' in fn) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this['once' in fn && fn.once ? 'once' : 'on'](
					method as keyof ClientEvents,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn.bind(object) as any
				);
			}
		}
	}

	/** Registers a single handler */
	public registerHandler(handler: Handler) {
		this.compileCommandEvents(handler);
	}

	/** Compiles and registers a single command */
	public async compileCommand(
		path: string,
		name: string,
		parent: Collection<string, Command> = this.commands
	) {
		const CommandClass: typeof Command = (await import(path)).default;

		this.registerCommand(
			new CommandClass({
				client: this,
				name,
			}),
			parent
		);
	}

	/** Registers a single command */
	public registerCommand(
		command: Command,
		parent: Collection<string, Command> = this.commands
	) {
		let required = false;

		if (command.permissions.bitfield > 0 && parent !== this.commands) {
			throw new Error('permissions are only permitted on parent commands');
		}

		for (const argument of command.arguments) {
			if (!argument.required && required) {
				throw new Error(
					'optional arguments must come after required arguments'
				);
			}

			required = argument.required;
		}

		parent.set(command.name, command);

		command.init();
		this.compileCommandEvents(command);
	}

	/**
	 * Compiles and registers a directory of commands and returns the
	 * number of commands that were registered
	 */
	public async compileCommandDirectory(
		path: string,
		async = true,
		parent: Collection<string, Command> = this.commands
	): Promise<number> {
		const paths = traverse(path);
		const localCommands: Map<string, Promise<void>> = new Map();

		let count = 0;

		for (;;) {
			const { value: id, done } = await paths.next();

			if (done) {
				for (const childPath of id) {
					const commandPromise = localCommands.get(childPath);
					if (!commandPromise) continue;

					await commandPromise;
					const command = parent.get(childPath)!;

					const promise = this.compileCommandDirectory(
						join(path, childPath),
						async,
						command.subcommands
					);

					if (async) {
						promise.then(c => (count += c));
					} else {
						count += await promise;
					}
				}

				return count;
			}

			++count;

			const name = id.slice(0, -3);

			localCommands.set(
				name,
				this.compileCommand(join(path, id), name, parent)
			);
		}
	}

	/** Compiles and registers a directory of handlers */
	public async compileHandlerDirectory(path: string) {
		const paths = traverse(path);

		for (;;) {
			const { value: id, done } = await paths.next();

			if (done) {
				for (const childPath of id) {
					await this.compileCommandDirectory(join(path, childPath));
				}

				return;
			}

			const HandlerClass: typeof Handler = (await import(join(path, id)))
				.default;

			this.registerHandler(
				new HandlerClass({
					client: this,
				})
			);
		}
	}

	/** Publishes all active commands to the Discord API */
	public async publishCommands(guildId?: string) {
		if (this.flags.commandsRegistered) return;

		const payload: ApplicationCommandData[] = [];

		for (const [, command] of this.commands) {
			if (!command.enabled) continue;

			const options = command.subcommands
				.filter(c => c.enabled)
				.map(c => c.getSlashData());

			options.push(...command.arguments.map(a => a.getSlashData()));
			payload.push({
				type: ApplicationCommandType.ChatInput,
				name: command.name,
				description: command.description,
				options,
				defaultMemberPermissions: command.permissions,
			});
		}

		if (guildId) {
			await this.application?.commands.set(payload, guildId);
		} else {
			await this.application?.commands.set(payload);
		}
	}

	/** Initializes the client. This *must* the run before the client logs in */
	public async init() {
		if (this.initialized) return;
		this.initialized = true;

		this.registerHandler(new CommandHandler({ client: this }));
		this.registerHandler(new ReadyHandler({ client: this }));
	}
}
