import { EventHandler } from '@structs/Events';
import { Handler } from '@structs/Handler';

export default class ReadyHandler extends Handler {
	@EventHandler()
	public async ready() {
		if (!this.client.initialized)
			throw new Error(
				'client not initialized before being ready. hint: use Client#init'
			);

		if (this.client.settings.registerCommandsOnReady !== false) {
			await this.client.registerCommands();
		}

		if (this.client.settings.verbose !== false) {
			console.log(`Logged in as ${this.client.user!.tag}!`);
		}
	}
}
