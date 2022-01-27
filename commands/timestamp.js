const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'timestamp',
    description: 'Sends you the current UNIX timestamp to make it easier to find recordings.',
    options: [],
    run: async ({ ctx }) => {
        const connection = getVoiceConnection(ctx.guild.id);
        if (!connection) {
            await ctx.reply({ content: 'I\'m not currently recording.', ephemeral: true });
            return; 
        }
        const timestamp = Date.now();
        await ctx.user.send(`**Current UNIX timestamp:** \`${timestamp}\`\nSaved **<t:${timestamp}:R>** (hover for exact time)`);
        await ctx.reply({ content: `**Current UNIX timestamp:** \`${timestamp}\`\n**Check your DMs!**`, ephemeral: true });
    }
};