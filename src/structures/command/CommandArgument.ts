import {
	User,
	GuildChannel,
	Attachment,
	CommandInteraction,
	Role,
	GuildMember,
	CommandInteractionOptionResolver,
} from 'discord.js';
import { CommandSource } from '@structs/command/Command';

export enum CommandArgumentType {
	String = 3,
	Integer = 4,
	Boolean = 5,
	User = 6,
	Channel = 7,
	Role = 8,
	Mentionable = 9,
	Number = 10,
	Attachment = 11,
	Member = -1,
}

export type CommandArgumentTypes =
	| CommandArgumentType.String
	| CommandArgumentType.Integer
	| CommandArgumentType.Boolean
	| CommandArgumentType.User
	| CommandArgumentType.Channel
	| CommandArgumentType.Role
	| CommandArgumentType.Mentionable
	| CommandArgumentType.Number
	| CommandArgumentType.Attachment
	| CommandArgumentType.Member;

type CommandArgumentResponse<
	T extends CommandArgumentType,
	R extends boolean
> =
	| {
			valid: false;
			value: string;
	  }
	| {
			valid: true;
			value: CommandArgumentValue<T, R>;
	  };

interface CommandArgumentValueMap {
	[CommandArgumentType.String]: string;
	[CommandArgumentType.Integer]: number;
	[CommandArgumentType.Boolean]: boolean;
	[CommandArgumentType.User]: User;
	[CommandArgumentType.Channel]: GuildChannel;
	[CommandArgumentType.Role]: Role;
	[CommandArgumentType.Mentionable]: Role | User | GuildChannel;
	[CommandArgumentType.Number]: number;
	[CommandArgumentType.Attachment]: Attachment;
	[CommandArgumentType.Member]: GuildMember;
}

export type CommandArgumentValue<
	T extends CommandArgumentType = CommandArgumentTypes,
	R extends boolean = true
> = R extends true
	? CommandArgumentValueMap[T]
	: CommandArgumentValueMap[T] | null;

const ARGUMENT_TYPE_TO_FUNCTION_NAME = {
	[CommandArgumentType.String]: 'getString',
	[CommandArgumentType.Integer]: 'getInteger',
	[CommandArgumentType.Boolean]: 'getBoolean',
	[CommandArgumentType.User]: 'getUser',
	[CommandArgumentType.Channel]: 'getChannel',
	[CommandArgumentType.Role]: 'getRole',
	[CommandArgumentType.Mentionable]: 'getMentionable',
	[CommandArgumentType.Number]: 'getNumber',
	[CommandArgumentType.Attachment]: 'getAttachment',
	[CommandArgumentType.Member]: 'getMember',
} as const;

type CommandArgumentFilter<T extends CommandArgumentType, R extends boolean> = (
	source: CommandInteraction,
	argument: CommandArgumentValue<T, R>
) => boolean;

interface CommandArgumentOptions<
	T extends CommandArgumentType,
	R extends boolean
> {
	name: string;
	description: string;
	type: T;
	error: string;
	required?: R;
	filter?: CommandArgumentFilter<T, R>;
}

export class CommandArgument<
	T extends CommandArgumentType = CommandArgumentTypes,
	R extends boolean = boolean
> {
	public type: T;
	public name: string;
	public description: string;
	public required: R | true;

	private filter?: CommandArgumentFilter<T, R>;
	private error: string;

	constructor(options: CommandArgumentOptions<T, R>) {
		this.type = options.type;
		this.name = options.name;
		this.description = options.description;
		this.filter = options.filter;
		this.required = options.required ?? true;
		this.error = options.error;
	}

	async run(source: CommandSource): Promise<CommandArgumentResponse<T, R>> {
		const argument = (
			source.options as CommandInteractionOptionResolver<'cached'>
		)[ARGUMENT_TYPE_TO_FUNCTION_NAME[this.type]](
			this.name,
			this.required
		) as CommandArgumentValue<T, R>;

		if (argument === null || this.filter) {
			try {
				if (this.filter && !(await this.filter(source, argument))) {
					throw new Error('input did not pass filter');
				}
			} catch {
				return {
					valid: false,
					value: this.error,
				};
			}
		}

		return {
			valid: true,
			value: argument,
		};
	}
}
