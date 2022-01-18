const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'stop',
    description: 'Stops recording a voice channel.',
    options: [],
    run: async ({ client, ctx }) => {
        const connection = getVoiceConnection(ctx.guild.id);
        if (!connection) {
            await ctx.reply({ content: 'I\'m not currently recording.', ephemeral: true });
            return; 
        }
        const data = client.recordings.get(ctx.guild.id);
        if (ctx.user.id !== data.startedBy) {
            await ctx.reply({ content: 'You did not start the recording, therefore you do not have permission to stop it.', ephemeral: true });
            return;
        }
        await connection.destroy();
        client.rec(`Stopped recording. (Recording ID: ${data.recording_id})`, data.recording_id);
        await ctx.reply({ content: `**Stopped recording.** Recording ID: \`${data.recording_id}\``, ephemeral: true });
    }
};