const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Affiche la latence du bot et de l\'API Discord',
    category: 'utility',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle('🏓 Pong!')
            .setDescription('Calcul de la latence en cours...')
            .setTimestamp();

        const sent = await message.reply({ embeds: [embed] });

        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        const newEmbed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latence du bot', value: `\`${latency}ms\``, inline: true },
                { name: 'Latence API', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        sent.edit({ embeds: [newEmbed] });
    }
};