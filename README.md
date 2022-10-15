# Framecord 🤖

![Build Status](https://github.com/matteopolak/framecord/actions/workflows/ci.yml/badge.svg)
![Docs Status](https://github.com/matteopolak/framecord/actions/workflows/docs.yml/badge.svg)
![NPM Package Status](https://github.com/matteopolak/framecord/actions/workflows/npm.yml/badge.svg)

[framecord](https://github.com/matteopolak/framecord) is a modular and extensible framework for creating Discord bots, created with [discord.js](https://github.com/discordjs/discord.js).

## Documentation

Check out the documentation at **[matteopolak.com/docs/framecord](https://matteopolak.com/docs/framecord)**.

## "Hello, world!"

The setup below will do the following:
1. Create a slash command called `/helloworld` that outputs the message `Hello {user}!`
2. Print `I just logged in as {username}!` to the console when the `ready` event is fired

`src/index.ts`
```typescript
import { join } from 'node:path';

import { IntentsBitField } from 'discord.js';
import { Client, Command } from '@matteopolak/framecord';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds
  ]
});

// Client#compileCommandDirectory takes an *absolute path* to the
// command directory, and will construct a tree of commands.
//
// Commands in nested folders will be grouped under the command by the
// same name as the folder (which *must* exist)
//
// By default, commands are added relative to the root command node,
// but you can provide the subcommand Collection of any command to start
// there instead.
await client.compileCommandDirectory(join(__dirname, 'commands'));

// Client#init must complete (i.e. await it) *before* the client is logged in.
await client.init();

client.login(process.env.TOKEN);
```

`src/commands/helloworld.ts`
```typescript
import {
  Command,
  CommandOptions,
  CommandResponse,
  CommandSource,
  EventHandler
} from '@matteopolak/framecord';

// *Must* be a default export in order to work properly when
// adding an entire command directory
export default class HelloWorld extends Command {
  // *Must* be an asynchronous function
  public async run(source: CommandSource): CommandResponse {
    return `Hello, ${source.user.username}!`;
  }

  // The @EventHandler decorator is used to define when
  // a method should be treated as an event listener
  //
  // It currently only has the `once` option, which (when true)
  // will stop listening to the event after it is fired once
  @EventHandler({ once: true })
  public async ready() {
    // `client` is a reference to the Client
    console.log(`I just logged in as ${this.client.user.username}!`);
  }
}
```