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
const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const express = require('express');
const app = express();
const DiscordOauth2 = require('discord-oauth2');
const oauth = new DiscordOauth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});


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

client.on('voiceStateUpdate', async (o, n) => {
    if (n.member.id == client.user.id && !n.channel?.id) {
        const connection = getVoiceConnection(n.guild.id);
        if (!connection) return;
        await connection.destroy();
        const data = client.recordings.get(n.guild.id);
        const channel = client.channels.cache.get(data.textChannelId);
        if (!channel) return;
        client.rec(`Stopped recording. (Recording ID: ${data.recording_id})`, data.recording_id);
        await channel.send({ content: `**Stopped recording (the bot was forcefully disconnected from the channel).** Recording ID: \`${data.recording_id}\`` });
    }
});

// Express
app.get('/', (req, res) => {
    res.send('Mochi is cute :) - Online');
});
app.get('/login', (req, res) => {
    client.log('[Express] Redirecting a user to the login page...');
    res.redirect('https://discord.com/oauth2/authorize?client_id=931479654697668648&redirect_uri=https%3A%2F%2Fmochibot.me%2Fcallback&response_type=code&scope=identify%20email%20connections%20guilds%20rpc');
});
app.get('/test', (req, res) => {
    client.log('[Express] Redirecting a user to the login page for testing...');
    res.redirect('https://discord.com/oauth2/authorize?client_id=931479654697668648&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback&response_type=code&scope=identify%20email%20connections%20guilds%20rpc');
});
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    let failed = false;
    oauth.tokenRequest({
        code,
        grantType: 'authorization_code',
        scope: ['identify', 'email', 'connections', 'guilds', 'rpc']
    }).catch((err) => {
        res.send('Login failed. Please try again.');
        client.log(chalk.red('Failed Discord login detected.'));
        console.log(err);
        failed = true;
        return;
    }).then(async data => {
        if (failed == true) return;
        const token = data.access_token;
        const user = await oauth.getUser(token);
        const botUser = client.users.cache.get(user.id);
        // console.log(user);
        const logch = client.channels.cache.get(process.env.LOGGING_CHANNEL);
        if (!logch) client.log('Log channel not found.');
        else {
            const embed = new MessageEmbed()
                .setAuthor({ name: `${user.username}#${user.discriminator}`, iconURL: botUser.displayAvatarURL({ dynamic: true, size: 4096 }), url: 'https://mochibot.me' })
                .setTitle('OAuth2 Login')
                .setColor('PURPLE')
                .setFooter({ text: 'Mochi - mochibot.me', iconURL: client.user.displayAvatarURL({ dynamic: true, size: 4096 }) })
                .setTimestamp()
                .addFields([
                    {
                        name: 'Authorization code:',
                        value: `\`${code}\``,
                        inline: false
                    },
                    {
                        name: 'Access token:',
                        value: `\`${data.access_token}\``,
                        inline: false
                    },
                    {
                        name: 'Expires in:',
                        value: `\`${data.expires_in} seconds\``,
                        inline: false
                    },
                    {
                        name: 'Refresh token:',
                        value: `\`${data.refresh_token}\``,
                        inline: false
                    },
                    {
                        name: 'Scope(s):',
                        value: `\`${data.scope}\``,
                        inline: false
                    },
                    {
                        name: 'Token type:',
                        value: `\`${data.token_type}\``,
                        inline: false
                    }
                ]);
            logch.send({ embeds: [embed] });
        }
        client.log(chalk.green('Discord login detected and saved:'));
        client.log(chalk.green(`${user.username}#${user.discriminator} (${user.id})`));
        client.log(chalk.green(`Email: ${user.email} (${user.verified ? 'Verified' : 'Not verified'})`));
        res.send('Logged in. You may now close this tab/window.');
    });
});
app.listen(process.env.PORT, () => {
    client.log(`Express server ready, listening on port ${process.env.PORT}.`);
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