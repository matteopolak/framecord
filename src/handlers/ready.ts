import { EventHandler } from '@structs/Events';
import { Handler } from '@structs/Handler';

export default class ReadyHandler extends Handler {
	@EventHandler()
	public async ready() {
		// Register commands automatically if it's enabled in the config
		if (this.client.settings.registerCommandsOnReady !== false) {
			await this.client.registerCommands();
		}

		// Print out a ready message if it's enabled in the config
		if (this.client.settings.verbose !== false) {
			console.log(`Logged in as ${this.client.user!.tag}!`);
		}
	}
}
