const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Déverrouille un salon',
    usage: '[#salon]',
    permissions: ['ManageChannels'],
    category: 'antiraid',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Vous n'avez pas la permission de déverrouiller les salons.");
        }

        // Obtenir le salon (celui mentionné ou le salon actuel)
        const channel = message.mentions.channels.first() || message.channel;

        // Vérifier si le bot a les permissions nécessaires dans ce salon
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Je n'ai pas la permission de gérer ce salon.");
        }

        try {
            // Vérifier si le salon est verrouillé
            const currentPermissions = channel.permissionOverwrites.cache.get(message.guild.id);
            if (!currentPermissions || !currentPermissions.deny.has(PermissionsBitField.Flags.SendMessages)) {
                return message.reply("Ce salon n'est pas verrouillé.");
            }

            // Déverrouiller le salon
            await channel.permissionOverwrites.edit(message.guild.id, {
                SendMessages: null
            });

            // Créer l'embed de déverrouillage
            const unlockEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🔓 Salon déverrouillé')
                .setDescription(`Ce salon a été déverrouillé par ${message.author}.`)
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            await channel.send({ embeds: [unlockEmbed] });

            // Envoyer dans les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(client.config.embed.color)
                        .setTitle('🔓 Salon déverrouillé')
                        .setDescription(`**Salon:** ${channel}\n**Modérateur:** ${message.author.tag}`)
                        .setFooter({ text: client.config.embed.footer })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur lors du déverrouillage:', error);
            message.reply("Une erreur est survenue lors du déverrouillage du salon.");
        }
    }
};