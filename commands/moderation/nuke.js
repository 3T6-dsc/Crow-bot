const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'Recrée entièrement un salon',
    usage: '[#salon]',
    permissions: ['ManageChannels'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Vous n'avez pas la permission de recréer des salons.");
        }

        try {
            // Récupérer le salon
            const channel = message.mentions.channels.first() || message.channel;
            
            // Sauvegarder les informations du salon
            const channelInfo = {
                name: channel.name,
                type: channel.type,
                topic: channel.topic,
                nsfw: channel.nsfw,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                parent: channel.parent,
                position: channel.position,
                rateLimitPerUser: channel.rateLimitPerUser
            };

            // Créer le nouveau salon
            const newChannel = await channel.clone({
                name: channel.name,
                reason: `Salon recréé par ${message.author.tag}`
            });

            // Supprimer l'ancien salon
            await channel.delete();

            // Ajuster la position si nécessaire
            await newChannel.setPosition(channelInfo.position);

            // Envoyer un message dans le nouveau salon
            const nukeEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('💥 Salon recréé')
                .setDescription(`Ce salon a été recréé par ${message.author}`)
                .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            await newChannel.send({ embeds: [nukeEmbed] });

        } catch (error) {
            console.error('Erreur lors du nuke:', error);
            message.channel.send("Une erreur est survenue lors de l'exécution de la commande.");
        }
    }
};


