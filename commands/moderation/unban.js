const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Débannir un utilisateur du serveur',
    usage: '<ID utilisateur> [raison]',
    permissions: ['BanMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("Vous n'avez pas la permission de débannir des membres.");
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply("Veuillez spécifier l'ID de l'utilisateur à débannir.");
        }

        // Récupérer l'ID de l'utilisateur
        const userId = args[0];

        // Vérifier si l'ID est valide
        if (!/^\d+$/.test(userId)) {
            return message.reply("L'ID spécifié n'est pas valide.");
        }

        try {
            // Vérifier si l'utilisateur est banni
            const banList = await message.guild.bans.fetch();
            const banInfo = banList.get(userId);

            if (!banInfo) {
                return message.reply("Cet utilisateur n'est pas banni.");
            }

            // Construire la raison
            const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

            // Créer l'embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🔓 Confirmation de débannissement')
                .setDescription(`Êtes-vous sûr de vouloir débannir ${banInfo.user.tag} ?\n\n**Raison:** ${reason}`)
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
                        // Débannir l'utilisateur
                        await message.guild.bans.remove(userId, `${reason} (Débanni par ${message.author.tag})`);

                        // Créer l'embed de confirmation
                        const unbanEmbed = new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setTitle('🔓 Membre débanni')
                            .setDescription(`${banInfo.user.tag} a été débanni du serveur.`)
                            .addFields(
                                { name: 'Raison', value: reason },
                                { name: 'Modérateur', value: message.author.tag }
                            )
                            .setFooter({ text: client.config.embed.footer })
                            .setTimestamp();

                        await message.channel.send({ embeds: [unbanEmbed] });

                        // Envoyer dans les logs si activés
                        if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                            const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                            if (logChannel) {
                                await logChannel.send({ embeds: [unbanEmbed] });
                            }
                        }

                    } catch (error) {
                        console.error('Erreur lors du débannissement:', error);
                        message.channel.send("Une erreur est survenue lors du débannissement.");
                    }
                } else {
                    // Si l'utilisateur annule
                    await confirmMessage.delete();
                    message.channel.send("Débannissement annulé.");
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    confirmMessage.delete().catch(() => {});
                    message.channel.send("Temps écoulé, débannissement annulé.");
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de la liste des bans:', error);
            message.reply("Une erreur est survenue lors de la récupération de la liste des bans.");
        }
    }
};