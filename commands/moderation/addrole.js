const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'addrole',
    description: 'Ajoute un rôle à un utilisateur',
    usage: '@utilisateur @role [raison]',
    permissions: ['ManageRoles'],
    category: 'moderation',
    async execute(message, args, client) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("Vous n'avez pas la permission de gérer les rôles.");
        }

        // Vérifier les arguments
        if (!args[0] || !args[1]) {
            const usageEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('❓ Utilisation de la commande')
                .addFields(
                    { name: 'Format', value: `\`${client.config.bot.prefix}addrole @utilisateur @role [raison]\`` },
                    { name: 'Exemple', value: `\`${client.config.bot.prefix}addrole @User123 @Membre Nouveau membre actif\`` }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            return message.reply({ 
                embeds: [usageEmbed], 
                ephemeral: true 
            });
        }

        // Récupérer le membre
        const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!member) {
            return message.reply('Utilisateur non trouvé.');
        }

        // Récupérer le rôle
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.reply('Rôle non trouvé.');
        }

        // Vérifier la hiérarchie des rôles
        if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply("Vous ne pouvez pas ajouter ce rôle car il est supérieur ou égal à votre plus haut rôle.");
        }

        // Vérifier si le bot peut gérer ce rôle
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply("Je ne peux pas ajouter ce rôle car il est supérieur ou égal à mon plus haut rôle.");
        }

        // Récupérer la raison
        const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

        try {
            // Vérifier si le membre a déjà le rôle
            if (member.roles.cache.has(role.id)) {
                return message.reply('Ce membre possède déjà ce rôle.');
            }

            // Ajouter le rôle
            await member.roles.add(role, reason);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('✅ Rôle ajouté')
                .setDescription(`Le rôle ${role} a été ajouté à ${member}.`)
                .addFields(
                    { name: 'Membre', value: member.toString(), inline: true },
                    { name: 'Rôle', value: role.toString(), inline: true },
                    { name: 'Modérateur', value: message.author.toString(), inline: true },
                    { name: 'Raison', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });

            await message.reply({ embeds: [embed] });

            // Essayer d'envoyer un DM au membre
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`🎭 Rôle ajouté sur ${message.guild.name}`)
                    .setDescription(`Le rôle ${role.name} vous a été ajouté.`)
                    .addFields(
                        { name: 'Modérateur', value: message.author.tag },
                        { name: 'Raison', value: reason }
                    )
                    .setTimestamp()
                    .setFooter({ text: client.config.embed.footer });

                await member.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Impossible d'envoyer un DM à ${member.user.tag}`);
            }

        } catch (error) {
            console.error('Erreur lors de l\'ajout du rôle:', error);
            message.reply('Une erreur est survenue lors de l\'ajout du rôle.');
        }
    }
};
