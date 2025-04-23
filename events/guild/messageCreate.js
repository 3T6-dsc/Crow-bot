const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    execute(message, client) {
        // Vérifier si le message mentionne le bot
        if (message.mentions.has(client.user)) {
            const embed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('👋 Bonjour!')
                .setDescription(`Je suis **${client.user.username}**, un bot de modération et d'administration pour votre serveur Discord.`)
                .addFields(
                    { 
                        name: '📌 Préfixe', 
                        value: `Mon préfixe est \`${client.config.bot.prefix}\``, 
                        inline: true 
                    },
                    { 
                        name: '❓ Aide', 
                        value: `Tapez \`${client.config.bot.prefix}help\` pour voir la liste de mes commandes`, 
                        inline: true 
                    }
                )
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });

            message.reply({ embeds: [embed] });
            return;
        }

        // Le reste du code existant pour le traitement des commandes
        if (!message.content.startsWith(client.config.bot.prefix) || message.author.bot) return;

        const args = message.content.slice(client.config.bot.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);

        if (!command) return;

        // Vérification de la whitelist (sauf pour la commande help)
        if (client.config?.whitelist?.enabled && 
            commandName !== 'help' && 
            Array.isArray(client.config?.whitelist?.users) &&
            !client.config.whitelist.users.includes(message.author.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Accès Refusé')
                .setDescription("Vous n'êtes pas dans la whitelist du bot.")
                .setTimestamp();
            
            return message.reply({ embeds: [errorEmbed] });
        }

        // Vérification des permissions si nécessaire
        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Permissions Manquantes')
                .setDescription(`Vous avez besoin des permissions suivantes : ${command.permissions.join(', ')}`)
                .setTimestamp();
            
            return message.reply({ embeds: [errorEmbed] });
        }

        // Créer un embed pour les logs de commande
        const logEmbed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle('Commande exécutée')
            .addFields(
                { name: 'Commande', value: commandName },
                { name: 'Arguments', value: args.length > 0 ? args.join(' ') : 'Aucun' },
                { name: 'Utilisateur', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Canal', value: `${message.channel.name} (${message.channel.id})` }
            )
            .setTimestamp()
            .setFooter({ text: client.config.embed.footer });

        try {
            // Exécuter la commande
            command.execute(message, args, client);

            // Envoyer les logs de commande si activés
            if (client.config.logs.enabled && client.config.logs.channels.command) {
                const commandLogChannel = client.channels.cache.get(client.config.logs.channels.command);
                if (commandLogChannel) {
                    commandLogChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error(error);
            message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
            
            // Créer un embed pour les logs d'erreur
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Erreur de commande')
                .addFields(
                    { name: 'Commande', value: commandName },
                    { name: 'Arguments', value: args.length > 0 ? args.join(' ') : 'Aucun' },
                    { name: 'Utilisateur', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Canal', value: `${message.channel.name} (${message.channel.id})` },
                    { name: 'Erreur', value: `\`\`\`${error.stack}\`\`\`` }
                )
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });

            // Envoyer les logs d'erreur si activés
            if (client.config.logs.enabled && client.config.logs.channels.error) {
                const errorChannel = client.channels.cache.get(client.config.logs.channels.error);
                if (errorChannel) {
                    errorChannel.send({ embeds: [errorEmbed] });
                }
            }
        }
    }
};



