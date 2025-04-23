const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Expulser un utilisateur du serveur',
    usage: '@utilisateur <raison>',
    permissions: ['KickMembers'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply("Vous n'avez pas la permission d'expulser des membres.");
        }

        // Vérifier les arguments
        if (!args[0]) {
            return message.reply('Veuillez mentionner un utilisateur à expulser.');
        }

        // Récupérer l'utilisateur
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            return message.reply('Utilisateur non trouvé.');
        }

        // Vérifier qu'on ne peut pas se kick soi-même
        if (user.id === message.author.id) {
            return message.reply("Vous ne pouvez pas vous expulser vous-même.");
        }

        // Récupérer le membre
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply("Cet utilisateur n'est pas dans le serveur.");
        }

        // Vérifier la hiérarchie des rôles
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply("Vous ne pouvez pas expulser ce membre car son rôle est supérieur ou égal au vôtre.");
        }

        if (!member.kickable) {
            return message.reply("Je ne peux pas expulser ce membre. Vérifiez que mon rôle est assez haut dans la hiérarchie.");
        }

        // Construire la raison
        const reason = args.slice(1).join(' ');
        if (!reason) {
            return message.reply("Veuillez spécifier une raison pour l'expulsion.");
        }

        try {
            // Essayer d'envoyer un DM à l'utilisateur AVANT l'expulsion
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`👢 Vous avez été expulsé de ${message.guild.name}`)
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

            // Expulser le membre
            await member.kick(`${reason} (Expulsé par ${message.author.tag})`);

            // Créer l'embed de confirmation
            const kickEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('👢 Membre expulsé')
                .setDescription(`${user.tag} a été expulsé du serveur.`)
                .addFields(
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: message.author.tag }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            await message.channel.send({ embeds: [kickEmbed] });

            // Envoyer dans les logs si activés
            if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                if (logChannel) {
                    await logChannel.send({ embeds: [kickEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur lors de l\'expulsion:', error);
            message.channel.send("Une erreur est survenue lors de l'expulsion.");
        }
    }
};