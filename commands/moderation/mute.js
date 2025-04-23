const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');
const SanctionsManager = require('../../database/sanctionsManager');

module.exports = {
    name: 'mute',
    description: 'Réduire au silence un membre temporairement',
    usage: '@utilisateur <durée> <raison>',
    permissions: ['ModerateMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply("Vous n'avez pas la permission de réduire les membres au silence.");
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply('Veuillez mentionner un utilisateur.');
        }
        if (!args[1]) {
            return message.reply('Veuillez spécifier une durée (ex: 1h, 1d, 30m).');
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

        // Vérifier qu'on ne peut pas se mute soi-même
        if (user.id === message.author.id) {
            return message.reply("Vous ne pouvez pas vous réduire au silence vous-même.");
        }

        // Vérifier la hiérarchie des rôles
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply("Vous ne pouvez pas réduire ce membre au silence car son rôle est supérieur ou égal au vôtre.");
        }

        if (!member.moderatable) {
            return message.reply("Je ne peux pas réduire ce membre au silence. Vérifiez que mon rôle est assez haut dans la hiérarchie.");
        }

        // Convertir la durée en millisecondes
        const duration = ms(args[1]);
        if (!duration || duration < 1000 || duration > 2419200000) { // Entre 1 seconde et 28 jours
            return message.reply('Veuillez spécifier une durée valide entre 1 seconde et 28 jours (ex: 1h, 1d, 30m).');
        }

        // Construire la raison
        const reason = args.slice(2).join(' ');
        if (!reason) {
            return message.reply('Veuillez spécifier une raison.');
        }

        try {
            // Vérifier si le membre est déjà mute
            if (member.isCommunicationDisabled()) {
                return message.reply('Ce membre est déjà réduit au silence.');
            }

            // Ajouter le mute dans la base de données
            const sanctionNumber = await SanctionsManager.addMute(
                user.id,
                message.guild.id,
                reason,
                message.author.id,
                duration
            );

            // Essayer d'envoyer un DM à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`🔇 Vous avez été réduit au silence dans ${message.guild.name}`)
                    .addFields(
                        { name: 'Sanction n°', value: `\`${sanctionNumber}\`` },
                        { name: 'Durée', value: args[1] },
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    )
                    .setFooter({ text: client.config.embed.footer })
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Impossible d'envoyer un DM à ${user.tag}`);
            }

            // Appliquer le mute
            await member.timeout(duration, `${reason} (Mute par ${message.author.tag})`);

            // Créer l'embed de confirmation
            const muteEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('🔇 Membre réduit au silence')
                .setDescription(`${user.tag} a été réduit au silence.`)
                .addFields(
                    { name: 'Sanction n°', value: `\`${sanctionNumber}\`` },
                    { name: 'Durée', value: args[1] },
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: message.author.tag }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            await message.channel.send({ embeds: [muteEmbed] });

            // Envoyer dans les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                if (logChannel) {
                    await logChannel.send({ embeds: [muteEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur lors du mute:', error);
            message.channel.send("Une erreur est survenue lors de la réduction au silence.");
        }
    }
};
