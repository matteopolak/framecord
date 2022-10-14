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

export interface BaseOptions {
	registerCommandsOnReady?: boolean;
	verbose?: boolean;
}

export interface Flags {
	commandsRegistered: boolean;
}

export default class BaseClient extends Client {
	/** A `Collection` of all commands */
	public commands: Collection<string, Command> = new Collection();

	/** The settings provided to the client */
	public settings: BaseOptions;

	/** Whether the client has been initialized */
	public initialized = false;

	/** Internal flags to ensure certain methods aren't run multiple times */
	private flags: Partial<Flags> = {};

	constructor(options: ClientOptions & BaseOptions) {
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
	public compileHandler(handler: Handler) {
		this.compileCommandEvents(handler);
	}

	/** Registers a single command */
	public compileCommand(
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

	/** Registers and compiles a directory of commands */
	public async compileCommandDirectory(
		path: string,
		parent: Collection<string, Command> = this.commands
	) {
		const paths = traverse(path);
		let count = 0;

		for (;;) {
			const { value: id, done } = await paths.next();

			if (done) {
				for (const childPath of id) {
					const command = parent.get(childPath);

					count += command
						? await this.compileCommandDirectory(
								join(path, childPath),
								command.subcommands
						  )
						: 0;
				}

				return count;
			}

			++count;

			const CommandClass: typeof Command = await import(join(path, id));

			this.compileCommand(
				new CommandClass({
					client: this,
					name: id.slice(0, -3),
				}),
				parent
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

			this.compileHandler(
				new HandlerClass({
					client: this,
				})
			);
		}
	}

	/** Registers all active commands with the Discord API */
	public async registerCommands() {
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

		await this.application?.commands.set(payload, '968627637444558918');
	}

	/** Initializes the client. This *must* the run before the client logs in */
	public async init() {
		if (this.initialized) return;
		this.initialized = true;

		await this.compileHandlerDirectory(join(__dirname, '..', 'handlers'));
	}
}
