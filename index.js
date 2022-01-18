/* 
    ::::::::::::::::::::::::::::::::::::::::::::::::
    ::  Mochi - A Discord voice channel recorder  ::
    ::::::::::::::::::::::::::::::::::::::::::::::::

    Made by thaddeuskkr (Thaddeus Kuah)
    - This bot is meant to be as fast and as clean / simple as possible.
    - Many of the normal things that I do (such as external event files) are not present here.
    - This is not a good example of a discord.js bot.

    Contact details:
    - Mail: thaddeuskkr@gmail.com
    - Discord: thaddeuskkr#4416
    - GitHub: thaddeuskkr

    See license details at the bottom of this file.
*/
require('dotenv').config();
const fs = require('fs');
const chalk = require('chalk');
const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.DIRECT_MESSAGES
    ],
    partials: [
        'CHANNEL'
    ]
});

client.log = async (details) => {
    let date = new Date();
    let timestamp = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.toLocaleTimeString()}`;
    console.log(chalk.magenta('Mochi') + chalk.blue(' | ') + chalk.magenta(timestamp) + chalk.blue(' | ') + details || '');
};
client.rec = async (details, id) => {
    let date = new Date();
    let timestamp = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.toLocaleTimeString()}`;
    console.log(chalk.magenta('Mochi') + chalk.blue(' | ') + chalk.magenta(timestamp) + chalk.blue(' | ') + chalk.red(`[REC] [${id}] `) + details || '');
};
client.recordings = new Collection();

// Events
client.once('ready', async () => {
    client.log(`ONLINE - ${client.user.tag}`);
    await client.user.setActivity('my cute self <3', { type: 'WATCHING' });
    await client.user.setStatus('idle');
    client.commands = new Collection();
    const commands = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));
    for (const command of commands) {
        const cmd = require(`./commands/${command}`);
        client.commands.set(cmd.name, cmd);
    }
    await client.application.commands.set(client.commands.map(cmd => cmd));
    client.log(`Loaded ${client.commands.size} command(s) and synchronised application commands.`);
});

client.on('interactionCreate', async (ctx) => {
    let args = [];
    if (!ctx.isCommand()) return;
    for (let option of ctx.options.data) {
        if (option.type === 'SUB_COMMAND') {
            if (option.name) args.push(option.name);
            option.options?.forEach(x =>  {
                if (x.value) args.push(x.value);
            });
        } else if (option.value) args.push(option.value);
    }
    const command = client.commands.get(ctx.commandName);
    if (!command) return;

    command.run({ client, ctx, args, avatar: client.user.displayAvatarURL({ dynamic: true, size: 4096 }) }).catch(err => {
        ctx.reply(`Error: \`${err.message}\``);
        client.log('Error: ' + ctx.commandName);
        console.log(err);
    });
});


client.login(process.env.TOKEN);
/*
    Mochi - a Discord bot to record voice channels
    Copyright (C) 2022 thaddeuskkr

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/