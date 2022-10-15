import BaseClient from '@structs/BaseClient';
import { Events } from '@structs/Events';

export interface HandlerOptions {
	client: BaseClient;
}

/**
 * The base handler to extend from.
 *
 * @example
 * ```typescript
 * export default class ReadyHandler extends Handler {
 *   // @EventHandler denotes an event listener, with the event being
 *   // the name of the method
 *   @EventHandler({ once: true })
 *   public async ready() {
 *     // Execute some code when the `ready` event is fired
 *     this.client.user?.setPresence({
 *       status: 'online',
 *       activities: [
 *         {
 *           type: ActivityType.Watching,
 *           name: 'over the server',
 *         },
 *       ],
 *     });
 *   }
 *
 *   @EventHandler()
 *   public async guildMemberAdd(member: GuildMember) {
 *     if (member.guild.systemChannel) {
 *       await message(
 *         member.guild.systemChannel,
 *         embed({ description: `${member} has joined the server!` })
 *       );
 *     }
 *   }
 *
 *   @EventHandler()
 *   public async guildMemberRemove(member: GuildMember) {
 *     if (member.guild.systemChannel) {
 *       await message(
 *         member.guild.systemChannel,
 *         embed({
 *           description: `**${escapeMarkdown(
 *             member.user.tag
 *           )}** has left the server :(`,
 *         })
 *       );
 *     }
 *   }
 * }
 * ```
 */
export class Handler extends Events {
	/** A reference to the main client */
	protected client: BaseClient;

	constructor(options: HandlerOptions) {
		super();

		this.client = options.client;
	}
}
