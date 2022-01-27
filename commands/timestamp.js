const { getVoiceConnection } = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'timestamp',
    description: 'Sends you the current UNIX timestamp to make it easier to find recordings.',
    options: [],
    run: async ({ ctx, avatar }) => {
        const connection = getVoiceConnection(ctx.guild.id);
        if (!connection) {
            await ctx.reply({ content: 'I\'m not currently recording.', ephemeral: true });
            return; 
        }
        const timestamp = Date.now();
        const embed = new MessageEmbed()
            .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL({ dynamic: true, size: 4096 }) })
            .setColor('PURPLE')
            .setDescription(`**Current UNIX timestamp:** \`${timestamp}\``)
            .setTimestamp()
            .setFooter({ text: 'Mochi - mochibot.me | Saved', iconURL: avatar });
        await ctx.user.send({ embeds: [embed] });
        await ctx.reply({ content: `**Current UNIX timestamp:** \`${timestamp}\`\n**Check your DMs!**`, ephemeral: true });
    }
};