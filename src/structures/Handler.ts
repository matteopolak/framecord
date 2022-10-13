import BaseClient from '@structs/BaseClient';
import { Events } from '@structs/Events';

interface HandlerOptions {
	client: BaseClient;
}

export class Handler extends Events {
	protected client: BaseClient;

	constructor(options: HandlerOptions) {
		super();

		this.client = options.client;
	}
}
