const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const SanctionsManager = require('../../database/sanctionsManager');

module.exports = {
    name: 'sanctions',
    description: 'Affiche ou gère les sanctions d\'un membre ou du serveur',
    usage: '[@utilisateur] [remove <@utilisateur> <numéro>]',
    permissions: ['ModerateMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        // Gestion de la suppression d'une sanction
        if (args[0] === 'remove') {
            if (!args[1] || !args[2]) {
                return message.reply('Usage: sanctions remove @utilisateur <numéro>');
            }
            
            const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
            if (!user) {
                return message.reply('Utilisateur non trouvé.');
            }

            const sanctionNumber = parseInt(args[2]);
            if (isNaN(sanctionNumber)) {
                return message.reply('Le numéro de sanction doit être un nombre.');
            }
            
            try {
                // Récupérer la sanction
                const sanction = await SanctionsManager.getSanction(user.id, message.guild.id, sanctionNumber);
                if (!sanction) {
                    return message.reply('Sanction non trouvée.');
                }

                // Supprimer la sanction
                await SanctionsManager.removeSanction(user.id, message.guild.id, sanctionNumber);

                const embed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle('✅ Sanction supprimée')
                    .setDescription(`La sanction n°${sanctionNumber} de ${user.tag} a été supprimée.`)
                    .setTimestamp()
                    .setFooter({ text: client.config.embed.footer });

                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Erreur lors de la suppression de la sanction:', error);
                return message.reply('Une erreur est survenue lors de la suppression de la sanction.');
            }
        }

        // Affichage des sanctions
        let user = null;
        let title = '';
        let sanctions = null;

        try {
            if (args[0]) {
                user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
                if (!user) return message.reply('Utilisateur non trouvé.');
                
                title = `Sanctions de ${user.tag}`;
                sanctions = await SanctionsManager.getUserHistory(user.id, message.guild.id);
            } else {
                title = `Sanctions du serveur ${message.guild.name}`;
                sanctions = await SanctionsManager.getGuildHistory(message.guild.id);
            }

            const embed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle(title)
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });

            const formatDate = (timestamp) => {
                return new Date(timestamp).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            if (sanctions.warns.length > 0) {
                const warnsText = sanctions.warns
                    .map(warn => {
                        return `• Sanction n°\`${warn.sanction_number}\`\n` +
                               `Date: ${formatDate(warn.timestamp)}\n` +
                               `Raison: ${warn.reason}\n` +
                               `Modérateur: <@${warn.moderator_id}>\n`;
                    })
                    .join('\n');
                
                embed.addFields({
                    name: `⚠️ Avertissements (${sanctions.warns.length})`,
                    value: warnsText.slice(0, 1024)
                });
            }

            if (sanctions.bans.length > 0) {
                const bansText = sanctions.bans
                    .map(ban => {
                        return `• Sanction n°\`${ban.sanction_number}\`\n` +
                               `Date: ${formatDate(ban.timestamp)}\n` +
                               `Raison: ${ban.reason}\n` +
                               `Modérateur: <@${ban.moderator_id}>\n`;
                    })
                    .join('\n');

                embed.addFields({
                    name: `🔨 Bans (${sanctions.bans.length})`,
                    value: bansText.slice(0, 1024)
                });
            }

            if (sanctions.warns.length === 0 && sanctions.bans.length === 0) {
                embed.setDescription("Aucune sanction trouvée.");
            }

            message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la récupération des sanctions:', error);
            message.reply('Une erreur est survenue lors de la récupération des sanctions.');
        }
    }
};

