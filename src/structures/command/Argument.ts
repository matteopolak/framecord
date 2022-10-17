import {
	User,
	GuildChannel,
	Attachment,
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

export enum ArgumentType {
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

export type ArgumentTypes =
	| ArgumentType.String
	| ArgumentType.Integer
	| ArgumentType.Boolean
	| ArgumentType.User
	| ArgumentType.Channel
	| ArgumentType.Role
	| ArgumentType.Mentionable
	| ArgumentType.Number
	| ArgumentType.Attachment
	| ArgumentType.Member;

export type ArgumentResponse<
	T extends ArgumentType,
	R extends boolean,
	V extends boolean = boolean,
	M = T
> = V extends true
	? {
			valid: true;
			value: MappedArgumentValue<T, R, M>;
	  }
	: V extends false
	? {
			valid: false;
			value: string;
			source: string;
	  }
	: never;

interface ArgumentValueMap {
	[ArgumentType.String]: string;
	[ArgumentType.Integer]: number;
	[ArgumentType.Boolean]: boolean;
	[ArgumentType.User]: User;
	[ArgumentType.Channel]: GuildChannel;
	[ArgumentType.Role]: Role;
	[ArgumentType.Mentionable]: Role | User | GuildChannel;
	[ArgumentType.Number]: number;
	[ArgumentType.Attachment]: Attachment;
	[ArgumentType.Member]: GuildMember;
}

export type ArgumentOptionsExtra<T> = Omit<
	T extends ArgumentType.String
		? ApplicationCommandStringOption
		: T extends ArgumentType.Integer
		? ApplicationCommandNumericOption
		: T extends ArgumentType.Boolean
		? ApplicationCommandBooleanOption
		: T extends ArgumentType.User
		? ApplicationCommandUserOption
		: T extends ArgumentType.Channel
		? ApplicationCommandChannelOption
		: T extends ArgumentType.Role
		? ApplicationCommandRoleOption
		: T extends ArgumentType.Mentionable
		? ApplicationCommandMentionableOption
		: T extends ArgumentType.Number
		? ApplicationCommandNumericOption
		: T extends ArgumentType.Attachment
		? ApplicationCommandAttachmentOption
		: T extends ArgumentType.Member
		? ApplicationCommandUserOption
		: unknown,
	'type' | 'description' | 'name' | 'required'
>;

export type MappedArgumentValue<
	T extends ArgumentType = ArgumentTypes,
	R extends boolean = true,
	M = ArgumentValue<T, R>
> = M extends ArgumentValue ? M : Awaited<M>;

export type ArgumentValue<
	T extends ArgumentType = ArgumentTypes,
	R extends boolean = true
> = R extends true ? ArgumentValueMap[T] : ArgumentValueMap[T] | null;

const ARGUMENT_TYPE_TO_FUNCTION_NAME = {
	[ArgumentType.String]: 'getString',
	[ArgumentType.Integer]: 'getInteger',
	[ArgumentType.Boolean]: 'getBoolean',
	[ArgumentType.User]: 'getUser',
	[ArgumentType.Channel]: 'getChannel',
	[ArgumentType.Role]: 'getRole',
	[ArgumentType.Mentionable]: 'getMentionable',
	[ArgumentType.Number]: 'getNumber',
	[ArgumentType.Attachment]: 'getAttachment',
	[ArgumentType.Member]: 'getMember',
} as const;

export type ArgumentFilter<T> = (
	argument: T,
	source: CommandSource
) => Promise<boolean> | boolean;

export type ArgumentMapper<T extends ArgumentType, M> = (
	argument: ArgumentValue<T, true>,
	source: CommandSource
) => M;

export type ArgumentDefault<T> =
	| ((source: CommandSource) => Promise<T> | T)
	| T;

export interface ArgumentOptionsBase<
	T extends ArgumentType,
	R extends boolean = true,
	M = T
> {
	name: string;
	description: string;
	type: T;
	error?: string;
	required?: R;
	filter?: ArgumentFilter<MappedArgumentValue<T, R, M>>;
	mapper?: ArgumentMapper<T, M>;
	default?: R extends true
		? undefined
		: ArgumentDefault<MappedArgumentValue<T, R, M>>;
}

export type ArgumentOptions<
	T extends ArgumentType,
	R extends boolean,
	M = T
> = ArgumentOptionsBase<T, R, M> & ArgumentOptionsExtra<T>;

export class Argument<
	T extends ArgumentType = ArgumentTypes,
	R extends boolean = true,
	M = T
> {
	/**
	 * The type of argument. For example, `ArgumentType.User` will require
	 * the executor to provide a `User`
	 */
	public type: T;

	/** The name of the slash command argument */
	public name: string;

	/** The description of the slash command argument */
	public description: string;

	/** Whether the argument must be provided */
	public required: R | true;

	/** Additional filter that must be passed */
	private filter?: ArgumentFilter<MappedArgumentValue<T, R, M>>;

	/** Maps the input to an output */
	private mapper?: ArgumentMapper<T, M>;

	private default?: ArgumentDefault<MappedArgumentValue<T, R, M>>;

	/** The error to display if the filter is not passed */
	private error?: string;

	/** Additional options for the argument */
	private options: Partial<ArgumentOptionsExtra<T>> = {};

	constructor(options: ArgumentOptions<T, R, M>) {
		this.type = options.type;
		this.name = options.name;
		this.description = options.description;
		this.filter = options.filter as
			| ArgumentFilter<MappedArgumentValue<T, R, M>>
			| undefined;
		this.mapper = options.mapper;
		this.default = options.default;
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

		if (this.filter && !this.error) {
			throw new Error(
				'the "error" option must be provided when the "filter" is provided'
			);
		}
	}

	/** Executes the argument and returns a validation response */
	async run(
		source: CommandSource
	): Promise<ArgumentResponse<T, R, boolean, M>> {
		let argument = (
			source.options as CommandInteractionOptionResolver<'cached'>
		)[ARGUMENT_TYPE_TO_FUNCTION_NAME[this.type]](
			this.name,
			this.required
		) as MappedArgumentValue<T, R, M>;

		if (argument === null && this.default) {
			return {
				valid: true,
				value:
					typeof this.default === 'function'
						? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
						  // @ts-ignore
						  await this.default(source)
						: this.default,
			};
		}

		if (this.mapper && argument !== null) {
			argument = (await this.mapper(
				argument as ArgumentValue<T, true>,
				source
			)) as MappedArgumentValue<T, R, M>;
		}

		if (this.filter) {
			try {
				if (
					argument !== null &&
					this.filter &&
					!(await this.filter(argument, source))
				) {
					throw new Error('input did not pass filter');
				}
			} catch {
				return {
					valid: false,
					value: this.error!,
					source: this.name,
				};
			}
		}

		return {
			valid: true,
			value: argument,
		};
	}

	/** Gets the Discord-compatible slash data */
	public getSlashData(): ApplicationCommandOptionData {
		return {
			...this.options,
			type: (this.type === ArgumentType.Member
				? ArgumentType.User
				: // eslint-disable-next-line @typescript-eslint/no-explicit-any
				  this.type) as any,
			name: this.name,
			description: this.description,
			required: this.required,
		};
	}
}
