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
}

export interface Flags {
	commandsRegistered: boolean;
}

export default class BaseClient extends Client {
	public commands: Collection<string, Command> = new Collection();
	public settings: BaseOptions;
	public initialized = false;

	private flags: Partial<Flags> = {};

	constructor(options: ClientOptions & BaseOptions) {
		super(options);

		this.settings = options;
	}

	public compileCommandEvents<T extends Command | Handler>(object: T) {
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

	public compileHandler(handler: Handler) {
		this.compileCommandEvents(handler);
	}

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

		parent.set(command.id, command);

		this.compileCommandEvents(command);
	}

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
					id: id.slice(0, -3),
				}),
				parent
			);
		}
	}

	public async registerCommands() {
		if (this.flags.commandsRegistered) return;

		const payload: ApplicationCommandData[] = [];

		for (const [, command] of this.commands) {
			const options = command.subcommands
				.filter(c => c.enabled)
				.map(c => c.getSlashData());

			if (command.enabled)
				options.push(...command.arguments.map(a => a.getSlashData()));

			if (options.length === 0 && !command.enabled) continue;

			payload.push({
				type: ApplicationCommandType.ChatInput,
				name: command.id,
				description: command.description,
				options,
				defaultMemberPermissions: command.permissions,
			});
		}

		await this.application?.commands.set(payload, '968627637444558918');
	}

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

	public async init() {
		await this.compileHandlerDirectory(join(__dirname, '..', 'handlers'));

		this.initialized = true;
	}
}
