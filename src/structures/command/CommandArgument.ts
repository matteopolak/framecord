import {
	User,
	GuildChannel,
	Attachment,
	CommandInteraction,
	Role,
	GuildMember,
	CommandInteractionOptionResolver,
	ApplicationCommandOptionData,
	ApplicationCommandAttachmentOption,
	ApplicationCommandNumericOption,
	ApplicationCommandUserOption,
	ApplicationCommandBooleanOption,
	ApplicationCommandChannelOption,
	ApplicationCommandMentionableOption,
	ApplicationCommandRoleOption,
	ApplicationCommandStringOption,
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

type CommandArgumentOptionsExtra<T> = Omit<
	T extends CommandArgumentType.String
		? ApplicationCommandStringOption
		: T extends CommandArgumentType.Integer
		? ApplicationCommandNumericOption
		: T extends CommandArgumentType.Boolean
		? ApplicationCommandBooleanOption
		: T extends CommandArgumentType.User
		? ApplicationCommandUserOption
		: T extends CommandArgumentType.Channel
		? ApplicationCommandChannelOption
		: T extends CommandArgumentType.Role
		? ApplicationCommandRoleOption
		: T extends CommandArgumentType.Mentionable
		? ApplicationCommandMentionableOption
		: T extends CommandArgumentType.Number
		? ApplicationCommandNumericOption
		: T extends CommandArgumentType.Attachment
		? ApplicationCommandAttachmentOption
		: T extends CommandArgumentType.Member
		? ApplicationCommandUserOption
		: unknown,
	'type' | 'description' | 'name' | 'required'
>;

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

interface CommandArgumentOptionsBase<
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

type CommandArgumentOptions<
	T extends CommandArgumentType,
	R extends boolean
> = CommandArgumentOptionsBase<T, R> & CommandArgumentOptionsExtra<T>;

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
	private options: Partial<CommandArgumentOptionsExtra<T>> = {};

	constructor(options: CommandArgumentOptions<T, R>) {
		this.type = options.type;
		this.name = options.name;
		this.description = options.description;
		this.filter = options.filter;
		this.required = options.required ?? true;
		this.error = options.error;

		/* eslint-disable @typescript-eslint/ban-ts-comment */

		if ('autocomplete' in options && !options.autocomplete) {
			this.options.autocomplete = options.autocomplete;
		}

		if ('choices' in options) {
			// @ts-ignore
			this.options.choices = options.choices;
		}

		if ('minValue' in options) {
			// @ts-ignore
			this.options.minValue = options.minValue;
		}

		if ('maxValue' in options) {
			// @ts-ignore
			this.options.maxValue = options.maxValue;
		}

		if ('minLength' in options) {
			// @ts-ignore
			this.options.minLength = options.minLength;
		}

		if ('maxLength' in options) {
			// @ts-ignore
			this.options.maxLength = options.maxLength;
		}

		/* eslint-enable @typescript-eslint/ban-ts-comment */
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

	public getSlashData(): ApplicationCommandOptionData {
		return {
			...this.options,
			type: (this.type === CommandArgumentType.Member
				? CommandArgumentType.User
				: // eslint-disable-next-line @typescript-eslint/no-explicit-any
				  this.type) as any,
			name: this.name,
			description: this.description,
			required: this.required,
		};
	}
}
