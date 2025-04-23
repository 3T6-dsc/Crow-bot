const { EmbedBuilder } = require('discord.js');
const { snipes } = require('../../events/guild/messageDelete.js');

module.exports = {
    name: 'snipe',
    description: 'Affiche le dernier message supprimé',
    category: 'utility',
    execute(message, args, client) {
        // Récupérer le dernier message supprimé
        const snipe = snipes.get(message.channel.id);
        
        if (!snipe) {
            return message.reply("Il n'y a pas de message supprimé récemment dans ce salon.");
        }

        // Créer et envoyer l'embed
        const embed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setAuthor({
                name: snipe.author.tag,
                iconURL: snipe.author.displayAvatarURL({ dynamic: true })
            })
            .setDescription(snipe.content)
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp(snipe.timestamp);

        message.reply({ embeds: [embed] });
    }
};

