const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuildSettingsManager = require('../../database/guildSettingsManager');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // --- SYSTÈME ANTI-LIEN ---
        // On vérifie d'abord si le message contient un lien
        const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[^\s]+)/gi;
        
        if (linkRegex.test(message.content)) {
            try {
                // Vérifier si l'anti-lien est activé pour ce serveur
                const settings = await GuildSettingsManager.getSettings(message.guild.id);
                
                if (settings.antilink_enabled === 1) {
                    // Vérifier si l'utilisateur est exempté (Admin ou Whitelist)
                    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
                    const isWhitelisted = client.config.whitelist.users.includes(message.author.id);

                    if (!isAdmin && !isWhitelisted) {
                        await message.delete().catch(() => {});
                        
                        const warningMsg = await message.channel.send({ 
                            content: `${message.author}, les liens sont interdits sur ce serveur ! 🚫` 
                        });
                        
                        // Supprimer le message d'avertissement après 5 secondes
                        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
                        
                        // Log de l'action
                        if (client.config.logs.enabled && client.config.logs.channels.moderation) {
                            const logChannel = message.guild.channels.cache.get(client.config.logs.channels.moderation);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('#FFA500') // Orange
                                    .setTitle('🛡️ Lien bloqué')
                                    .setDescription(`**Utilisateur:** ${message.author.tag}\n**Salon:** ${message.channel}\n**Contenu:** \`\`\`${message.content}\`\`\``)
                                    .setTimestamp()
                                    .setFooter({ text: client.config.embed.footer });
                                logChannel.send({ embeds: [logEmbed] });
                            }
                        }
                        return; // Arrêter le traitement ici si c'était un lien interdit
                    }
                }
            } catch (error) {
                console.error("Erreur système anti-lien:", error);
            }
        }
        // --- FIN SYSTÈME ANTI-LIEN ---

        // Vérifier si le message mentionne le bot
        if (message.mentions.has(client.user) && !message.mentions.everyone) {
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
        if (!message.content.startsWith(client.config.bot.prefix)) return;

        const args = message.content.slice(client.config.bot.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);

        if (!command) return;

        // Vérification de la whitelist (sauf pour la commande help)
        if (client.config?.whitelist?.enabled && 
            commandName !== 'help' && 
            Array.isArray(client.config?.whitelist?.users) &&
            !client.config.whitelist.users.includes(message.author.id)) {
            
            // Vérifier si la commande n'est pas "ownerOnly"
            // Si c'est une commande normale, on laisse passer les admins du serveur généralement
            // Mais ici votre logique whitelist semble stricte. Je garde la logique existante :
            
            if (command.category === 'owner') {
                 const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Accès Refusé')
                    .setDescription("Vous n'êtes pas dans la whitelist du bot.")
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }
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