import { Client, ClientEvents, Collection } from 'discord.js';
import { Command } from '@structs/command/Command';
import { join } from 'node:path';
import { traverse } from '@util/fs';

export default class BaseClient extends Client {
	public commands: Collection<string, Command> = new Collection();

	public registerEvents(command: Command) {
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(command));
		let run = false;

		for (const method of methods) {
			if (run) {
				// eslint-disable-next-line @typescript-eslint/ban-types
				const fn: Function =
					// eslint-disable-next-line @typescript-eslint/ban-types
					(command[method as keyof Command] as Function).bind(command);

				if ('event' in fn) {
					this['once' in fn && fn.once ? 'once' : 'on'](
						method as keyof ClientEvents,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						fn as any
					);
				}
			}

			if (method === 'run') run = true;
		}
	}

	public registerCommand(
		command: Command,
		parent: Collection<string, Command> = this.commands
	) {
		let required = false;

		for (const argument of command.arguments) {
			if (!argument.required && required) {
				throw new Error(
					'optional arguments must come after required arguments'
				);
			}

			required = argument.required;
		}

		for (const alias of command.alias) {
			parent.set(alias, command);
		}
	}

	public async registerCommandDirectory(
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
						? await this.registerCommandDirectory(
								join(path, childPath),
								command.subcommands
						  )
						: 0;
				}

				return count;
			}

			++count;

			const CommandClass: typeof Command = await import(join(path, id));

			this.registerCommand(
				new CommandClass({
					client: this,
					id,
				}),
				parent
			);
		}
	}
}
