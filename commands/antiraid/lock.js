const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Verrouille un salon pour empêcher les membres d\'envoyer des messages',
    usage: '[#salon] [raison]',
    permissions: ['ManageChannels'],
    category: 'antiraid',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Vous n'avez pas la permission de verrouiller les salons.");
        }

        // Obtenir le salon (celui mentionné ou le salon actuel)
        const channel = message.mentions.channels.first() || message.channel;

        // Vérifier si le bot a les permissions nécessaires dans ce salon
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Je n'ai pas la permission de gérer ce salon.");
        }

        // Récupérer la raison
        const reason = args.filter(arg => !arg.startsWith('<#')).join(' ') || 'Aucune raison spécifiée';

        try {
            // Sauvegarder les permissions actuelles du rôle @everyone pour ce salon
            const currentPermissions = channel.permissionOverwrites.cache.get(message.guild.id);
            const currentSendMessages = currentPermissions ? currentPermissions.allow.has(PermissionsBitField.Flags.SendMessages) : null;

            // Si le salon est déjà verrouillé
            if (currentPermissions && currentPermissions.deny.has(PermissionsBitField.Flags.SendMessages)) {
                return message.reply("Ce salon est déjà verrouillé.");
            }

            // Créer l'embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🔒 Confirmation de verrouillage')
                .setDescription(`Êtes-vous sûr de vouloir verrouiller le salon ${channel} ?\n\n**Raison:** ${reason}`)
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            // Envoyer le message de confirmation
            const confirmMessage = await message.reply({ embeds: [confirmEmbed] });

            // Ajouter les réactions
            await confirmMessage.react('✅');
            await confirmMessage.react('❌');

            // Collecter la réponse
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            const collector = confirmMessage.createReactionCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '✅') {
                    try {
                        // Verrouiller le salon
                        await channel.permissionOverwrites.edit(message.guild.id, {
                            SendMessages: false
                        });

                        // Créer l'embed de verrouillage
                        const lockEmbed = new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setTitle('🔒 Salon verrouillé')
                            .setDescription(`Ce salon a été verrouillé par ${message.author}.\n**Raison:** ${reason}`)
                            .setFooter({ text: client.config.embed.footer })
                            .setTimestamp();

                        await channel.send({ embeds: [lockEmbed] });

                        // Supprimer le message de confirmation
                        await confirmMessage.delete();

                        // Envoyer dans les logs si activés
                        if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                            const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor(client.config.embed.color)
                                    .setTitle('🔒 Salon verrouillé')
                                    .setDescription(`**Salon:** ${channel}\n**Modérateur:** ${message.author.tag}\n**Raison:** ${reason}`)
                                    .setFooter({ text: client.config.embed.footer })
                                    .setTimestamp();

                                await logChannel.send({ embeds: [logEmbed] });
                            }
                        }

                    } catch (error) {
                        console.error('Erreur lors du verrouillage du salon:', error);
                        message.channel.send("Une erreur est survenue lors du verrouillage du salon.");
                    }
                } else {
                    // Si l'utilisateur annule
                    await confirmMessage.delete();
                    message.channel.send("Verrouillage annulé.");
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    confirmMessage.delete().catch(() => {});
                    message.channel.send("Temps écoulé, verrouillage annulé.");
                }
            });

        } catch (error) {
            console.error('Erreur lors du verrouillage:', error);
            message.reply("Une erreur est survenue lors du verrouillage du salon.");
        }
    }
};