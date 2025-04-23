const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'prix',
    description: 'Affiche les tarifs du bot',
    usage: '',
    category: 'utility',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle('💰 Tarifs du bot')
            .setDescription('Voici les différentes offres disponibles pour utiliser le bot:')
            .addFields(
                { 
                    name: '📦 Offre mensuelle', 
                    value: '```3€ / mois```',
                    inline: true 
                },
                { 
                    name: '🎁 Offre trimestrielle', 
                    value: '```7€ / 3 mois```\n*(Économisez 2€)*',
                    inline: true 
                }
            )
            .addFields({
                name: '📝 Comment acheter ?',
                value: 'Pour acheter le bot, ouvrez un ticket.'
            })
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
};