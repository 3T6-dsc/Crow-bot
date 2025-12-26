const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Verrouille un salon pour empêcher les membres d\'envoyer des messages',
    usage: '[#salon] [raison]',
    permissions: ['ManageChannels'],
    category: 'antiraid',
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur
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
            // Vérifier si le salon est déjà verrouillé
            const currentPermissions = channel.permissionOverwrites.cache.get(message.guild.id);
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

            // Créer les boutons de confirmation
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_lock')
                        .setLabel('Confirmer')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('cancel_lock')
                        .setLabel('Annuler')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

            // Envoyer le message de confirmation
            const confirmMessage = await message.reply({ 
                embeds: [confirmEmbed], 
                components: [row] 
            });

            // Collecter la réponse via les boutons
            const filter = i => i.user.id === message.author.id;
            const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async interaction => {
                if (interaction.customId === 'confirm_lock') {
                    try {
                        // Verrouiller le salon
                        await channel.permissionOverwrites.edit(message.guild.id, {
                            SendMessages: false
                        });

                        // Créer l'embed final
                        const lockEmbed = new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setTitle('🔒 Salon verrouillé')
                            .setDescription(`Ce salon a été verrouillé par ${message.author}.\n**Raison:** ${reason}`)
                            .setFooter({ text: client.config.embed.footer })
                            .setTimestamp();

                        // Mettre à jour le message d'origine
                        await interaction.update({ embeds: [lockEmbed], components: [] });

                        // Si le salon verrouillé est différent du salon actuel, envoyer un message là-bas aussi
                        if (channel.id !== message.channel.id) {
                            await channel.send({ embeds: [lockEmbed] });
                        }

                        // Envoyer dans les logs de modération
                        if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                            const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                            if (logChannel) {
                                logChannel.send({ embeds: [lockEmbed] });
                            }
                        }

                    } catch (error) {
                        console.error('Erreur lors du verrouillage du salon:', error);
                        await interaction.reply({ content: "Une erreur est survenue lors du verrouillage du salon.", ephemeral: true });
                    }
                } else {
                    // Annulation
                    await interaction.update({ content: "🚫 Verrouillage annulé.", embeds: [], components: [] });
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    confirmMessage.edit({ content: "⏰ Temps écoulé, action annulée.", embeds: [], components: [] }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('Erreur lors du verrouillage:', error);
            message.reply("Une erreur est survenue lors de l'exécution de la commande.");
        }
    }
};