const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'finduser',
    description: 'Trouve un utilisateur en vocal dans le serveur',
    usage: '<nom/mention/id>',
    permissions: ['MoveMembers'], // Ajout des permissions requises
    category: 'moderation', // Changement de catégorie
    async execute(message, args, client) {
        // Embed d'erreur réutilisable
        const errorEmbed = (description) => {
            return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription(description)
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });
        };

        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return message.reply({ 
                embeds: [errorEmbed("Vous n'avez pas la permission d'utiliser cette commande.")] 
            });
        }

        // Vérifier si un argument est fourni
        if (!args[0]) {
            return message.reply({ 
                embeds: [errorEmbed('Veuillez spécifier un utilisateur à rechercher.')] 
            });
        }

        // Récupérer l'utilisateur
        let targetUser;
        try {
            targetUser = message.mentions.members.first() 
                || message.guild.members.cache.get(args[0])
                || message.guild.members.cache.find(member => 
                    member.user.username.toLowerCase().includes(args.join(' ').toLowerCase()) ||
                    (member.nickname && member.nickname.toLowerCase().includes(args.join(' ').toLowerCase()))
                );
        } catch (error) {
            return message.reply({ 
                embeds: [errorEmbed("Je n'ai pas pu trouver cet utilisateur.")] 
            });
        }

        if (!targetUser) {
            return message.reply({ 
                embeds: [errorEmbed("Je n'ai pas pu trouver cet utilisateur.")] 
            });
        }

        // Vérifier si l'utilisateur est en vocal
        if (!targetUser.voice.channel) {
            return message.reply({ 
                embeds: [errorEmbed(`**${targetUser.user.tag}** n'est pas connecté en vocal.`)] 
            });
        }

        // Créer l'embed de succès
        const successEmbed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle('🎯 Utilisateur trouvé!')
            .setDescription(`**${targetUser.user.tag}** est connecté dans le salon:\n`
                + `🔊 ${targetUser.voice.channel.name}`)
            .addFields(
                { 
                    name: '📊 Statut vocal', 
                    value: [
                        targetUser.voice.mute ? '🔇 Muet' : '🔊 Non muet',
                        targetUser.voice.deaf ? '🔇 Sourd' : '👂 Non sourd',
                        targetUser.voice.streaming ? '🎥 En stream' : '❌ Pas en stream',
                        targetUser.voice.selfVideo ? '📹 Caméra activée' : '❌ Pas de caméra'
                    ].join('\n'),
                    inline: true 
                },
                { 
                    name: '👥 Autres utilisateurs', 
                    value: `Il y a ${targetUser.voice.channel.members.size - 1} autre(s) personne(s) dans ce salon`,
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ text: client.config.embed.footer });

        // Ajouter l'avatar si disponible
        if (targetUser.user.avatar) {
            successEmbed.setThumbnail(targetUser.user.displayAvatarURL({ dynamic: true }));
        }

        // Créer les boutons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_them')
                    .setLabel('Me déplacer vers son salon')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️'),
                new ButtonBuilder()
                    .setCustomId('bring_here')
                    .setLabel('Le faire venir dans mon salon')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⬅️')
            );

        // Envoyer l'embed avec les boutons
        const reply = await message.reply({ 
            embeds: [successEmbed],
            components: [row]
        });

        // Créer le collecteur de boutons
        const filter = i => i.user.id === message.author.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            // Vérifier si l'auteur est en vocal
            if (!message.member.voice.channel) {
                await i.reply({ 
                    embeds: [errorEmbed("Vous devez être dans un salon vocal pour utiliser cette fonction.")],
                    ephemeral: true 
                });
                return;
            }

            // Vérifier si la cible est toujours en vocal
            if (!targetUser.voice.channel) {
                await i.reply({ 
                    embeds: [errorEmbed(`**${targetUser.user.tag}** n'est plus en vocal.`)],
                    ephemeral: true 
                });
                return;
            }

            // Vérifier les permissions
            const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.MoveMembers);
            if (!hasPermission) {
                await i.reply({ 
                    embeds: [errorEmbed("Vous n'avez pas la permission de déplacer des membres.")],
                    ephemeral: true 
                });
                return;
            }

            try {
                if (i.customId === 'join_them') {
                    // Déplacer l'auteur vers le salon de la cible
                    await message.member.voice.setChannel(targetUser.voice.channel);
                    await i.reply({ 
                        content: `✅ Vous avez été déplacé dans le salon **${targetUser.voice.channel.name}**`,
                        ephemeral: true 
                    });
                } else if (i.customId === 'bring_here') {
                    // Déplacer la cible vers le salon de l'auteur
                    await targetUser.voice.setChannel(message.member.voice.channel);
                    await i.reply({ 
                        content: `✅ **${targetUser.user.tag}** a été déplacé dans votre salon`,
                        ephemeral: true 
                    });
                }
            } catch (error) {
                await i.reply({ 
                    embeds: [errorEmbed("Je n'ai pas pu effectuer le déplacement. Vérifiez que j'ai les permissions nécessaires.")],
                    ephemeral: true 
                });
            }
        });

        collector.on('end', () => {
            // Désactiver les boutons après 60 secondes
            row.components.forEach(button => button.setDisabled(true));
            reply.edit({ components: [row] }).catch(() => {});
        });
    }
};


