const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const SanctionsManager = require('../../database/sanctionsManager');

module.exports = {
    name: 'ban',
    description: 'Bannir un utilisateur du serveur',
    usage: '@utilisateur <raison> [--days <1-7>]',
    permissions: ['BanMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("Vous n'avez pas la permission de bannir des membres.");
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply('Veuillez mentionner un utilisateur à bannir.');
        }

        // Récupérer l'utilisateur
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            return message.reply('Utilisateur non trouvé.');
        }

        // Vérifier qu'on ne peut pas se bannir soi-même
        if (user.id === message.author.id) {
            return message.reply("Vous ne pouvez pas vous bannir vous-même.");
        }

        // Récupérer le membre
        const member = message.guild.members.cache.get(user.id);

        // Vérifier la hiérarchie des rôles si c'est un membre du serveur
        if (member) {
            if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
                return message.reply("Vous ne pouvez pas bannir ce membre car son rôle est supérieur ou égal au vôtre.");
            }

            if (!member.bannable) {
                return message.reply("Je ne peux pas bannir ce membre. Vérifiez que mon rôle est assez haut dans la hiérarchie.");
            }
        }

        // Analyser les arguments pour la durée de suppression des messages
        let deleteMessageDays = 0;
        let reason = '';
        
        const daysIndex = args.indexOf('--days');
        if (daysIndex !== -1 && args[daysIndex + 1]) {
            deleteMessageDays = parseInt(args[daysIndex + 1]);
            if (isNaN(deleteMessageDays) || deleteMessageDays < 0 || deleteMessageDays > 7) {
                return message.reply("Le nombre de jours pour la suppression des messages doit être entre 0 et 7.");
            }
            // Retirer les arguments --days et le nombre de la raison
            args.splice(daysIndex, 2);
        }

        // Construire la raison (tous les arguments restants)
        reason = args.slice(1).join(' ');
        if (!reason) {
            return message.reply('Veuillez spécifier une raison pour le bannissement.');
        }

        try {
            // Essayer d'envoyer un DM à l'utilisateur AVANT le bannissement
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`🔨 Vous avez été banni de ${message.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    )
                    .setFooter({ text: client.config.embed.footer })
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Impossible d'envoyer un DM à ${user.tag}`);
            }

            // Bannir l'utilisateur en utilisant deleteMessageSeconds
            await message.guild.members.ban(user, {
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60, // Conversion des jours en secondes
                reason: `${reason} (Banni par ${message.author.tag})`
            });

            // Ajouter le ban dans la base de données
            const sanctionNumber = await SanctionsManager.addBan(user.id, message.guild.id, reason, message.author.id);

            // Créer l'embed de confirmation
            const banEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🔨 Membre banni')
                .setDescription(`${user.tag} a été banni du serveur.`)
                .addFields(
                    { name: 'Sanction n°', value: `\`${sanctionNumber}\`` },
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: message.author.tag },
                    { name: 'Messages supprimés', value: `${deleteMessageDays} jours` }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            await message.channel.send({ embeds: [banEmbed] });

            // Envoyer dans les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                if (logChannel) {
                    await logChannel.send({ embeds: [banEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur lors du bannissement:', error);
            message.channel.send("Une erreur est survenue lors du bannissement.");
        }
    }
};


