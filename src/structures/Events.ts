import {
	AnyThreadChannel,
	ApplicationCommandPermissionsUpdateData,
	Collection,
	Client,
	DMChannel,
	ForumChannel,
	Guild,
	GuildBan,
	GuildEmoji,
	GuildMember,
	GuildScheduledEvent,
	GuildTextBasedChannel,
	Interaction,
	Invite,
	Message,
	MessageReaction,
	NewsChannel,
	NonThreadGuildBasedChannel,
	PartialGuildMember,
	PartialMessage,
	PartialMessageReaction,
	PartialThreadMember,
	PartialUser,
	Presence,
	Role,
	Snowflake,
	StageInstance,
	Sticker,
	TextBasedChannel,
	TextChannel,
	ThreadMember,
	Typing,
	User,
	VoiceChannel,
	VoiceState,
	CacheType,
	GuildScheduledEventStatus,
} from 'discord.js';

export interface EventsExt {
	applicationCommandPermissionsUpdate(
		data: ApplicationCommandPermissionsUpdateData
	): unknown;
	cacheSweep(message: string): unknown;
	channelCreate(channel: NonThreadGuildBasedChannel): unknown;
	channelDelete(channel: DMChannel | NonThreadGuildBasedChannel): unknown;
	channelPinsUpdate(channel: TextBasedChannel, date: Date): unknown;
	channelUpdate(
		oldChannel: DMChannel | NonThreadGuildBasedChannel,
		newChannel: DMChannel | NonThreadGuildBasedChannel
	): unknown;
	debug(message: string): unknown;
	warn(message: string): unknown;
	emojiCreate(emoji: GuildEmoji): unknown;
	emojiDelete(emoji: GuildEmoji): unknown;
	emojiUpdate(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): unknown;
	error(error: Error): unknown;
	guildBanAdd(ban: GuildBan): unknown;
	guildBanRemove(ban: GuildBan): unknown;
	guildCreate(guild: Guild): unknown;
	guildDelete(guild: Guild): unknown;
	guildUnavailable(guild: Guild): unknown;
	guildIntegrationsUpdate(guild: Guild): unknown;
	guildMemberAdd(member: GuildMember): unknown;
	guildMemberAvailable(member: GuildMember | PartialGuildMember): unknown;
	guildMemberRemove(member: GuildMember | PartialGuildMember): unknown;
	guildMembersChunk(
		members: Collection<Snowflake, GuildMember>,
		guild: Guild,
		data: { count: number; index: number; nonce: string | undefined }
	): unknown;
	guildMemberUpdate(
		oldMember: GuildMember | PartialGuildMember,
		newMember: GuildMember
	): unknown;
	guildUpdate(oldGuild: Guild, newGuild: Guild): unknown;
	inviteCreate(invite: Invite): unknown;
	inviteDelete(invite: Invite): unknown;
	messageCreate(message: Message): unknown;
	messageDelete(message: Message | PartialMessage): unknown;
	messageReactionRemoveAll(
		message: Message | PartialMessage,
		reactions: Collection<string | Snowflake, MessageReaction>
	): unknown;
	messageReactionRemoveEmoji(
		reaction: MessageReaction | PartialMessageReaction
	): unknown;
	messageDeleteBulk(
		messages: Collection<Snowflake, Message | PartialMessage>,
		channel: GuildTextBasedChannel
	): unknown;
	messageReactionAdd(
		reaction: MessageReaction | PartialMessageReaction,
		user: User | PartialUser
	): unknown;
	messageReactionRemove(
		reaction: MessageReaction | PartialMessageReaction,
		user: User | PartialUser
	): unknown;
	messageUpdate(
		oldMessage: Message | PartialMessage,
		newMessage: Message | PartialMessage
	): unknown;
	presenceUpdate(oldPresence: Presence | null, newPresence: Presence): unknown;
	ready(client: Client<true>): unknown;
	invalidated(): unknown;
	roleCreate(role: Role): unknown;
	roleDelete(role: Role): unknown;
	roleUpdate(oldRole: Role, newRole: Role): unknown;
	threadCreate(thread: AnyThreadChannel, newlyCreated: boolean): unknown;
	threadDelete(thread: AnyThreadChannel): unknown;
	threadListSync(
		threads: Collection<Snowflake, AnyThreadChannel>,
		guild: Guild
	): unknown;
	threadMemberUpdate(oldMember: ThreadMember, newMember: ThreadMember): unknown;
	threadMembersUpdate(
		addedMembers: Collection<Snowflake, ThreadMember>,
		removedMembers: Collection<Snowflake, ThreadMember | PartialThreadMember>,
		thread: AnyThreadChannel
	): unknown;
	threadUpdate(
		oldThread: AnyThreadChannel,
		newThread: AnyThreadChannel
	): unknown;
	typingStart(typing: Typing): unknown;
	userUpdate(oldUser: User | PartialUser, newUser: User): unknown;
	voiceStateUpdate(oldState: VoiceState, newState: VoiceState): unknown;
	webhookUpdate(
		channel: TextChannel | NewsChannel | VoiceChannel | ForumChannel
	): unknown;
	interactionCreate(interaction: Interaction): unknown;
	shardDisconnect(closeEvent: CloseEvent, shardId: number): unknown;
	shardError(error: Error, shardId: number): unknown;
	shardReady(
		shardId: number,
		unavailableGuilds: Set<Snowflake> | undefined
	): unknown;
	shardReconnecting(shardId: number): unknown;
	shardResume(shardId: number, replayedEvents: number): unknown;
	stageInstanceCreate(stageInstance: StageInstance): unknown;
	stageInstanceUpdate(
		oldStageInstance: StageInstance | null,
		newStageInstance: StageInstance
	): unknown;
	stageInstanceDelete(stageInstance: StageInstance): unknown;
	stickerCreate(sticker: Sticker): unknown;
	stickerDelete(sticker: Sticker): unknown;
	stickerUpdate(oldSticker: Sticker, newSticker: Sticker): unknown;
	guildScheduledEventCreate(guildScheduledEvent: GuildScheduledEvent): unknown;
	guildScheduledEventUpdate(
		oldGuildScheduledEvent: GuildScheduledEvent | null,
		newGuildScheduledEvent: GuildScheduledEvent
	): unknown;
	guildScheduledEventDelete(guildScheduledEvent: GuildScheduledEvent): unknown;
	guildScheduledEventUserAdd(
		guildScheduledEvent: GuildScheduledEvent,
		user: User
	): unknown;
	guildScheduledEventUserRemove(
		guildScheduledEvent: GuildScheduledEvent,
		user: User
	): unknown;
}

export interface EventHandlerOptions {
	once: boolean;
}

export function EventHandler(options?: Partial<EventHandlerOptions>) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: any, key: string) {
		target[key].once = options?.once ?? false;
		target[key].event = true;
	};
}

export class Events implements EventsExt {
	/* eslint-disable @typescript-eslint/no-unused-vars */
	applicationCommandPermissionsUpdate(
		data: ApplicationCommandPermissionsUpdateData
	): unknown {
		throw new Error('Method not implemented.');
	}

	cacheSweep(message: string): unknown {
		throw new Error('Method not implemented.');
	}

	channelCreate(channel: NonThreadGuildBasedChannel): unknown {
		throw new Error('Method not implemented.');
	}

	channelDelete(channel: DMChannel | NonThreadGuildBasedChannel): unknown {
		throw new Error('Method not implemented.');
	}

	channelPinsUpdate(channel: TextBasedChannel, date: Date): unknown {
		throw new Error('Method not implemented.');
	}

	channelUpdate(
		oldChannel: DMChannel | NonThreadGuildBasedChannel,
		newChannel: DMChannel | NonThreadGuildBasedChannel
	): unknown {
		throw new Error('Method not implemented.');
	}

	debug(message: string): unknown {
		throw new Error('Method not implemented.');
	}

	warn(message: string): unknown {
		throw new Error('Method not implemented.');
	}

	emojiCreate(emoji: GuildEmoji): unknown {
		throw new Error('Method not implemented.');
	}

	emojiDelete(emoji: GuildEmoji): unknown {
		throw new Error('Method not implemented.');
	}

	emojiUpdate(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): unknown {
		throw new Error('Method not implemented.');
	}

	error(error: Error): unknown {
		throw new Error('Method not implemented.');
	}

	guildBanAdd(ban: GuildBan): unknown {
		throw new Error('Method not implemented.');
	}

	guildBanRemove(ban: GuildBan): unknown {
		throw new Error('Method not implemented.');
	}

	guildCreate(guild: Guild): unknown {
		throw new Error('Method not implemented.');
	}

	guildDelete(guild: Guild): unknown {
		throw new Error('Method not implemented.');
	}

	guildUnavailable(guild: Guild): unknown {
		throw new Error('Method not implemented.');
	}

	guildIntegrationsUpdate(guild: Guild): unknown {
		throw new Error('Method not implemented.');
	}

	guildMemberAdd(member: GuildMember): unknown {
		throw new Error('Method not implemented.');
	}

	guildMemberAvailable(member: GuildMember | PartialGuildMember): unknown {
		throw new Error('Method not implemented.');
	}

	guildMemberRemove(member: GuildMember | PartialGuildMember): unknown {
		throw new Error('Method not implemented.');
	}

	guildMembersChunk(
		members: Collection<string, GuildMember>,
		guild: Guild,
		data: { count: number; index: number; nonce: string | undefined }
	): unknown {
		throw new Error('Method not implemented.');
	}

	guildMemberUpdate(
		oldMember: GuildMember | PartialGuildMember,
		newMember: GuildMember
	): unknown {
		throw new Error('Method not implemented.');
	}

	guildUpdate(oldGuild: Guild, newGuild: Guild): unknown {
		throw new Error('Method not implemented.');
	}

	inviteCreate(invite: Invite): unknown {
		throw new Error('Method not implemented.');
	}

	inviteDelete(invite: Invite): unknown {
		throw new Error('Method not implemented.');
	}

	messageCreate(message: Message<boolean>): unknown {
		throw new Error('Method not implemented.');
	}

	messageDelete(message: Message<boolean> | PartialMessage): unknown {
		throw new Error('Method not implemented.');
	}

	messageReactionRemoveAll(
		message: Message<boolean> | PartialMessage,
		reactions: Collection<string, MessageReaction>
	): unknown {
		throw new Error('Method not implemented.');
	}

	messageReactionRemoveEmoji(
		reaction: MessageReaction | PartialMessageReaction
	): unknown {
		throw new Error('Method not implemented.');
	}

	messageDeleteBulk(
		messages: Collection<string, Message<boolean> | PartialMessage>,
		channel: GuildTextBasedChannel
	): unknown {
		throw new Error('Method not implemented.');
	}

	messageReactionAdd(
		reaction: MessageReaction | PartialMessageReaction,
		user: User | PartialUser
	): unknown {
		throw new Error('Method not implemented.');
	}

	messageReactionRemove(
		reaction: MessageReaction | PartialMessageReaction,
		user: User | PartialUser
	): unknown {
		throw new Error('Method not implemented.');
	}

	messageUpdate(
		oldMessage: Message<boolean> | PartialMessage,
		newMessage: Message<boolean> | PartialMessage
	): unknown {
		throw new Error('Method not implemented.');
	}

	presenceUpdate(oldPresence: Presence | null, newPresence: Presence): unknown {
		throw new Error('Method not implemented.');
	}

	ready(client: Client<true>): unknown {
		throw new Error('Method not implemented.');
	}

	invalidated(): unknown {
		throw new Error('Method not implemented.');
	}

	roleCreate(role: Role): unknown {
		throw new Error('Method not implemented.');
	}

	roleDelete(role: Role): unknown {
		throw new Error('Method not implemented.');
	}

	roleUpdate(oldRole: Role, newRole: Role): unknown {
		throw new Error('Method not implemented.');
	}

	threadCreate(
		thread: AnyThreadChannel<boolean>,
		newlyCreated: boolean
	): unknown {
		throw new Error('Method not implemented.');
	}

	threadDelete(thread: AnyThreadChannel<boolean>): unknown {
		throw new Error('Method not implemented.');
	}

	threadListSync(
		threads: Collection<string, AnyThreadChannel<boolean>>,
		guild: Guild
	): unknown {
		throw new Error('Method not implemented.');
	}

	threadMemberUpdate(
		oldMember: ThreadMember,
		newMember: ThreadMember
	): unknown {
		throw new Error('Method not implemented.');
	}

	threadMembersUpdate(
		addedMembers: Collection<string, ThreadMember>,
		removedMembers: Collection<string, ThreadMember | PartialThreadMember>,
		thread: AnyThreadChannel<boolean>
	): unknown {
		throw new Error('Method not implemented.');
	}

	threadUpdate(
		oldThread: AnyThreadChannel<boolean>,
		newThread: AnyThreadChannel<boolean>
	): unknown {
		throw new Error('Method not implemented.');
	}

	typingStart(typing: Typing): unknown {
		throw new Error('Method not implemented.');
	}

	userUpdate(oldUser: User | PartialUser, newUser: User): unknown {
		throw new Error('Method not implemented.');
	}

	voiceStateUpdate(oldState: VoiceState, newState: VoiceState): unknown {
		throw new Error('Method not implemented.');
	}

	webhookUpdate(
		channel: NewsChannel | TextChannel | VoiceChannel | ForumChannel
	): unknown {
		throw new Error('Method not implemented.');
	}

	interactionCreate(interaction: Interaction<CacheType>): unknown {
		throw new Error('Method not implemented.');
	}

	shardDisconnect(closeEvent: CloseEvent, shardId: number): unknown {
		throw new Error('Method not implemented.');
	}

	shardError(error: Error, shardId: number): unknown {
		throw new Error('Method not implemented.');
	}

	shardReady(
		shardId: number,
		unavailableGuilds: Set<string> | undefined
	): unknown {
		throw new Error('Method not implemented.');
	}

	shardReconnecting(shardId: number): unknown {
		throw new Error('Method not implemented.');
	}

	shardResume(shardId: number, replayedEvents: number): unknown {
		throw new Error('Method not implemented.');
	}

	stageInstanceCreate(stageInstance: StageInstance): unknown {
		throw new Error('Method not implemented.');
	}

	stageInstanceUpdate(
		oldStageInstance: StageInstance | null,
		newStageInstance: StageInstance
	): unknown {
		throw new Error('Method not implemented.');
	}

	stageInstanceDelete(stageInstance: StageInstance): unknown {
		throw new Error('Method not implemented.');
	}

	stickerCreate(sticker: Sticker): unknown {
		throw new Error('Method not implemented.');
	}

	stickerDelete(sticker: Sticker): unknown {
		throw new Error('Method not implemented.');
	}

	stickerUpdate(oldSticker: Sticker, newSticker: Sticker): unknown {
		throw new Error('Method not implemented.');
	}

	guildScheduledEventCreate(
		guildScheduledEvent: GuildScheduledEvent<GuildScheduledEventStatus>
	): unknown {
		throw new Error('Method not implemented.');
	}

	guildScheduledEventUpdate(
		oldGuildScheduledEvent: GuildScheduledEvent<GuildScheduledEventStatus> | null,
		newGuildScheduledEvent: GuildScheduledEvent<GuildScheduledEventStatus>
	): unknown {
		throw new Error('Method not implemented.');
	}

	guildScheduledEventDelete(
		guildScheduledEvent: GuildScheduledEvent<GuildScheduledEventStatus>
	): unknown {
		throw new Error('Method not implemented.');
	}

	guildScheduledEventUserAdd(
		guildScheduledEvent: GuildScheduledEvent<GuildScheduledEventStatus>,
		user: User
	): unknown {
		throw new Error('Method not implemented.');
	}

	guildScheduledEventUserRemove(
		guildScheduledEvent: GuildScheduledEvent<GuildScheduledEventStatus>,
		user: User
	): unknown {
		throw new Error('Method not implemented.');
	}
}
