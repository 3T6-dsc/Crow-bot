const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Supprime un nombre spécifique de messages',
    usage: '<nombre> [utilisateur]',
    permissions: ['ManageMessages'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("Vous n'avez pas la permission de supprimer des messages.");
        }

        // Vérifier si un nombre est spécifié
        if (!args[0]) {
            return message.reply("Veuillez spécifier un nombre de messages à supprimer.");
        }

        // Convertir l'argument en nombre
        const amount = parseInt(args[0]);

        // Vérifier si le nombre est valide
        if (isNaN(amount)) {
            return message.reply("Veuillez spécifier un nombre valide.");
        }

        // Vérifier si le nombre est entre 1 et 100
        if (amount < 1 || amount > 100) {
            return message.reply("Veuillez spécifier un nombre entre 1 et 100.");
        }

        try {
            // Vérifier si un utilisateur est mentionné
            const user = message.mentions.users.first();
            let messages;

            // Supprimer le message de commande
            await message.delete();

            if (user) {
                // Récupérer les messages de l'utilisateur spécifié
                messages = await message.channel.messages.fetch({
                    limit: 100,
                });
                messages = messages.filter(m => m.author.id === user.id).first(amount);
            } else {
                // Récupérer tous les messages
                messages = await message.channel.messages.fetch({
                    limit: amount,
                });
            }

            // Supprimer les messages
            const deleted = await message.channel.bulkDelete(messages, true);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🗑️ Messages supprimés')
                .setDescription(`${deleted.size} messages ont été supprimés.`)
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            if (user) {
                embed.setDescription(`${deleted.size} messages de ${user.tag} ont été supprimés.`);
            }

            // Envoyer le message de confirmation qui s'auto-détruit après 5 secondes
            const confirmationMessage = await message.channel.send({ embeds: [embed] });
            setTimeout(() => confirmationMessage.delete().catch(() => {}), 5000);

            // Envoyer les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(client.config.embed.color)
                        .setTitle('🗑️ Messages supprimés')
                        .setDescription(`**Modérateur:** ${message.author.tag}\n**Canal:** ${message.channel}\n**Messages supprimés:** ${deleted.size}${user ? `\n**Utilisateur ciblé:** ${user.tag}` : ''}`)
                        .setFooter({ text: client.config.embed.footer })
                        .setTimestamp();

                    logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur lors de la suppression des messages:', error);
            
            if (error.code === 10008) {
                return message.channel.send("Impossible de supprimer des messages plus anciens que 14 jours.");
            }
            
            return message.channel.send("Une erreur est survenue lors de la suppression des messages.");
        }
    }
};