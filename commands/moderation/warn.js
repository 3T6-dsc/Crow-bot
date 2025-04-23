const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const SanctionsManager = require('../../database/sanctionsManager');

module.exports = {
    name: 'warn',
    description: 'Avertir un utilisateur',
    usage: '@utilisateur <raison>',
    permissions: ['ModerateMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        // Vérifier les arguments
        if (!args[0]) return message.reply('Veuillez mentionner un utilisateur.');
        if (!args[1]) return message.reply('Veuillez spécifier une raison.');

        // Récupérer l'utilisateur
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.reply('Utilisateur non trouvé.');

        // Vérifier qu'on ne peut pas warn soi-même
        if (user.id === message.author.id) {
            return message.reply("Vous ne pouvez pas vous avertir vous-même.");
        }

        // Récupérer le membre
        const member = message.guild.members.cache.get(user.id);
        
        // Vérifier la hiérarchie des rôles si le membre est toujours dans le serveur
        if (member) {
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return message.reply("Vous ne pouvez pas avertir ce membre car son rôle est supérieur ou égal au vôtre.");
            }
        }

        // Récupérer la raison
        const reason = args.slice(1).join(' ');

        try {
            // Ajouter l'avertissement dans la base de données
            const sanctionNumber = await SanctionsManager.addWarn(user.id, message.guild.id, reason, message.author.id);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('⚠️ Avertissement')
                .setDescription(`${user} a reçu l'avertissement n°${sanctionNumber}.`)
                .addFields(
                    { name: 'Sanction n°', value: `\`${sanctionNumber}\`` },
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: `${message.author}` }
                )
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });

            // Envoyer la confirmation
            message.channel.send({ embeds: [embed] });

            // Envoyer dans les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.command) {
                const logChannel = client.channels.cache.get(client.config.logs.channels.command);
                if (logChannel) {
                    logChannel.send({ embeds: [embed] });
                }
            }

            // Essayer d'envoyer un DM à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`⚠️ Vous avez reçu un avertissement sur ${message.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: `${message.author.tag}` }
                    )
                    .setTimestamp()
                    .setFooter({ text: client.config.embed.footer });

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                // Si l'envoi du DM échoue, on ignore silencieusement
                console.log(`Impossible d'envoyer un DM à ${user.tag}`);
            }

        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'avertissement:', error);
            message.reply('Une erreur est survenue lors de l\'ajout de l\'avertissement.');
        }
    }
};



