const { joinVoiceChannel, entersState, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { Transform } = require('stream');
const { OpusEncoder } = require('@discordjs/opus');
const { FileWriter } = require('wav');
const fs = require('fs');
module.exports = {
    name: 'record',
    description: 'Records a voice channel :D',
    options: [
        {
            name: 'channel',
            type: 'CHANNEL',
            description: 'Which voice channel would you like me to connect to? (Defaults to your own voice channel)',
            required: false
        }
    ],
    run: async ({ client, ctx, args }) => {
        class OpusDecodingStream extends Transform {
            encoder;
        
            constructor(options, encoder) {
                super(options);
                this.encoder = encoder;
            }
        
            _transform(data, encoding, callback) {
                this.push(this.encoder.decode(data));
                callback();
            }
        }
        await ctx.deferReply({ ephemeral: true });
        const voiceChannel = ctx.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE' || c.type === 'GUILD_STAGE_VOICE').find(channel => channel.id === args[0]) || ctx.member.voice.channel;
        if (!voiceChannel || (voiceChannel.type !== 'GUILD_VOICE' && voiceChannel.type !== 'GUILD_STAGE_VOICE')) return ctx.editReply({ content: 'Error: `Invalid voice channel provided.`', ephemeral: true });
        client.log(`Joining ${voiceChannel.name} (${voiceChannel.id})...`);
        const conn = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: ctx.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });
        
        try {
            await entersState(conn, VoiceConnectionStatus.Ready, 20e3);
            let ids = toNum(fs.readdirSync('./recordings'));
            ids = ids.sort(function (a, b) {  return a - b;  });
            let recording_id = ids[ids.length - 1] + 1;
            await fs.mkdirSync(`./recordings/${recording_id}`);
            await ctx.editReply({ content: `**Joined <#${voiceChannel.id}> and now recording.** Recording ID: \`${recording_id}\``, ephemeral: true });
            client.rec('Ready to record', recording_id);
            client.recordings.set(ctx.guild.id, { startedAt: Date.now(), startedBy: ctx.user.id, recording_id: recording_id, textChannelId: ctx.channel.id });
            const receiver = conn.receiver;

            receiver.speaking.on('start', (userId) => {
                const user = client.users.cache.get(userId);
                client.rec(`${user.username} started speaking`, recording_id);
                createListeningStream(receiver, userId, recording_id);
            });
            receiver.speaking.on('end', (userId) => {
                const user = client.users.cache.get(userId);
                client.rec(`${user.username} stopped speaking`, recording_id);
            });
        } catch (err) {
            client.log('Failed to join voice channel within 20 seconds.');
            console.log(err);
            await ctx.editReply({ content: 'Failed to join voice channel within 20 seconds, please try again later.', ephemeral: true });
        }

        function createListeningStream(receiver, userId, recording_id) {
            const encoder = new OpusEncoder(16000, 1);
            const filename = `./recordings/${recording_id}/${Date.now()}-${userId}.ogg`;
            receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 100,
                },
            }).pipe(new OpusDecodingStream({}, encoder)).pipe(new FileWriter(filename, {
                channels: 1,
                sampleRate: 16000
            }));
        }
        function toNum(arr) {
            let a = arr.map(Number);
            a = a.filter(value => { return !Number.isNaN(value); });
            return a;
        }
    }
};
