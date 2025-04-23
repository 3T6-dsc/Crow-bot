const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Retire la réduction au silence d\'un membre',
    usage: '@utilisateur [raison]',
    permissions: ['ModerateMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply("Vous n'avez pas la permission de gérer les réductions au silence.");
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply('Veuillez mentionner un utilisateur.');
        }

        // Récupérer l'utilisateur
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            return message.reply('Utilisateur non trouvé.');
        }

        // Récupérer le membre
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply("Cet utilisateur n'est pas dans le serveur.");
        }

        // Vérifier la hiérarchie des rôles
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply("Vous ne pouvez pas gérer ce membre car son rôle est supérieur ou égal au vôtre.");
        }

        if (!member.moderatable) {
            return message.reply("Je ne peux pas gérer ce membre. Vérifiez que mon rôle est assez haut dans la hiérarchie.");
        }

        // Vérifier si le membre est actuellement mute
        if (!member.isCommunicationDisabled()) {
            return message.reply("Ce membre n'est pas réduit au silence.");
        }

        // Récupérer la raison
        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

        try {
            // Essayer d'envoyer un DM à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`🔊 Votre réduction au silence a été retirée dans ${message.guild.name}`)
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

            // Retirer le mute
            await member.timeout(null, `${reason} (Unmute par ${message.author.tag})`);

            // Créer l'embed de confirmation
            const unmuteEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🔊 Réduction au silence retirée')
                .setDescription(`La réduction au silence de ${user.tag} a été retirée.`)
                .addFields(
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: message.author.tag }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            await message.channel.send({ embeds: [unmuteEmbed] });

            // Envoyer dans les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                if (logChannel) {
                    await logChannel.send({ embeds: [unmuteEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur lors du unmute:', error);
            message.channel.send("Une erreur est survenue lors du retrait de la réduction au silence.");
        }
    }
};