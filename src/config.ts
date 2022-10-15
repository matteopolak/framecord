import { ArgumentResponse, ArgumentTypes } from '@structs/command/Argument';

export const config = {
	/** Formatting options for messages sent from the client */
	formatting: {
		padFields: true,
		colour: 0xffffff,
	},
	messages: {
		parameterFailure: (
			response: ArgumentResponse<ArgumentTypes, boolean, false>
		) => `Error with parameter \`${response.source}\``,
	},
};
