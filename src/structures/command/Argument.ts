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

type ArgumentResponse<T extends ArgumentType, R extends boolean> =
	| {
			valid: false;
			value: string;
	  }
	| {
			valid: true;
			value: ArgumentValue<T, R>;
	  };

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

type ArgumentFilter<T extends ArgumentType> = (
	source: CommandInteraction,
	argument: ArgumentValue<T, true>
) => Promise<boolean> | boolean;

export interface ArgumentOptionsBase<
	T extends ArgumentType,
	R extends boolean
> {
	name: string;
	description: string;
	type: T;
	error?: string;
	required?: R;
	filter?: ArgumentFilter<T>;
}

export type ArgumentOptions<
	T extends ArgumentType,
	R extends boolean
> = ArgumentOptionsBase<T, R> & ArgumentOptionsExtra<T>;

export class Argument<T extends ArgumentType, R extends boolean> {
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
	private filter?: ArgumentFilter<ArgumentTypes>;

	/** The error to display if the filter is not passed */
	private error?: string;

	/** Additional options for the argument */
	private options: Partial<ArgumentOptionsExtra<T>> = {};

	constructor(options: ArgumentOptions<T, R>) {
		this.type = options.type;
		this.name = options.name;
		this.description = options.description;
		this.filter = options.filter as ArgumentFilter<ArgumentTypes> | undefined;
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
	async run(source: CommandSource): Promise<ArgumentResponse<T, R>> {
		const argument = (
			source.options as CommandInteractionOptionResolver<'cached'>
		)[ARGUMENT_TYPE_TO_FUNCTION_NAME[this.type]](
			this.name,
			this.required
		) as ArgumentValue<T, R>;

		if (this.filter) {
			try {
				if (
					argument !== null &&
					this.filter &&
					!(await this.filter(source, argument))
				) {
					throw new Error('input did not pass filter');
				}
			} catch {
				return {
					valid: false,
					value: this.error!,
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
