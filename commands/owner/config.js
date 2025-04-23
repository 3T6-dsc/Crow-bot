const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;

module.exports = {
    name: 'config',
    description: 'Configure les paramètres du bot',
    usage: '<category> <setting> <value>',
    category: 'owner',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est dans la whitelist
        if (!client.config.whitelist.users.includes(message.author.id)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        if (!args[0]) {
            return sendConfigMenu(message, client);
        }

        const category = args[0].toLowerCase();
        const setting = args[1]?.toLowerCase();
        const value = args.slice(2).join(' ');

        // Fonction pour sauvegarder la configuration
        const saveConfig = async () => {
            try {
                await fs.writeFile('./config.json', JSON.stringify(client.config, null, 2));
                return true;
            } catch (error) {
                console.error('Erreur lors de la sauvegarde de la configuration:', error);
                return false;
            }
        };

        switch (category) {
            case 'channels':
                if (!setting || !value) {
                    return sendChannelsHelp(message, client);
                }
                switch (setting) {
                    case 'error':
                    case 'command':
                    case 'welcome':
                        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(value);
                        if (!channel) {
                            return message.reply('Salon invalide.');
                        }
                        client.config.logs.channels[setting] = channel.id;
                        break;
                    default:
                        return message.reply('Type de salon invalide.');
                }
                break;

            case 'embed':
                if (!setting || !value) {
                    return sendEmbedHelp(message, client);
                }
                switch (setting) {
                    case 'color':
                        if (!/^#[0-9A-F]{6}$/i.test(value)) {
                            return message.reply('Couleur invalide. Utilisez le format hexadécimal (ex: #FF0000)');
                        }
                        client.config.embed.color = value;
                        break;
                    case 'footer':
                        client.config.embed.footer = value;
                        break;
                    case 'thumbnail':
                        if (!/^https?:\/\/.+/i.test(value)) {
                            return message.reply('URL invalide.');
                        }
                        client.config.embed.thumbnail = value;
                        break;
                    default:
                        return message.reply('Paramètre embed invalide.');
                }
                break;

            case 'bot':
                if (!setting || !value) {
                    return sendBotHelp(message, client);
                }
                switch (setting) {
                    case 'prefix':
                        if (value.length > 3) {
                            return message.reply('Le préfixe ne peut pas dépasser 3 caractères.');
                        }
                        client.config.bot.prefix = value;
                        break;
                    case 'status':
                        const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
                        if (!validStatuses.includes(value.toLowerCase())) {
                            return message.reply('Status invalide. Utilisez: online, idle, dnd, invisible');
                        }
                        client.config.bot.status = value.toLowerCase();
                        client.user.setStatus(value.toLowerCase());
                        break;
                    case 'activity':
                        client.config.bot.activity = value;
                        client.user.setActivity(value);
                        break;
                    case 'activitytype':
                        const validTypes = ['PLAYING', 'WATCHING', 'LISTENING', 'COMPETING'];
                        if (!validTypes.includes(value.toUpperCase())) {
                            return message.reply('Type d\'activité invalide. Utilisez: PLAYING, WATCHING, LISTENING, COMPETING');
                        }
                        client.config.bot.activityType = value.toUpperCase();
                        client.user.setActivity(client.config.bot.activity, { type: value.toUpperCase() });
                        break;
                    default:
                        return message.reply('Paramètre bot invalide.');
                }
                break;

            default:
                return sendConfigMenu(message, client);
        }

        // Sauvegarder la configuration
        if (await saveConfig()) {
            const successEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle('✅ Configuration mise à jour')
                .setDescription(`La configuration a été mise à jour avec succès.\n\`${category} ${setting}\` → \`${value}\``)
                .setTimestamp()
                .setFooter({ text: client.config.embed.footer });

            message.reply({ embeds: [successEmbed] });
        } else {
            message.reply('Une erreur est survenue lors de la sauvegarde de la configuration.');
        }
    }
};

function sendConfigMenu(message, client) {
    const embed = new EmbedBuilder()
        .setColor(client.config.embed.color)
        .setTitle('⚙️ Configuration du Bot')
        .setDescription('Utilisez les commandes suivantes pour configurer le bot:')
        .addFields(
            { 
                name: '📺 Channels', 
                value: '`config channels error #channel`\n`config channels command #channel`\n`config channels welcome #channel`'
            },
            { 
                name: '🎨 Embed', 
                value: '`config embed color #hexcolor`\n`config embed footer text`\n`config embed thumbnail url`'
            },
            { 
                name: '🤖 Bot', 
                value: '`config bot prefix symbol`\n`config bot status status`\n`config bot activity text`\n`config bot activitytype type`'
            }
        )
        .setTimestamp()
        .setFooter({ text: client.config.embed.footer });

    message.reply({ embeds: [embed] });
}

function sendChannelsHelp(message, client) {
    const embed = new EmbedBuilder()
        .setColor(client.config.embed.color)
        .setTitle('📺 Configuration des Salons')
        .addFields(
            { name: 'Salon d\'erreurs', value: '`config channels error #channel`' },
            { name: 'Salon des commandes', value: '`config channels command #channel`' },
            { name: 'Salon de bienvenue', value: '`config channels welcome #channel`' }
        )
        .setTimestamp()
        .setFooter({ text: client.config.embed.footer });

    message.reply({ embeds: [embed] });
}

function sendEmbedHelp(message, client) {
    const embed = new EmbedBuilder()
        .setColor(client.config.embed.color)
        .setTitle('🎨 Configuration des Embeds')
        .addFields(
            { name: 'Couleur', value: '`config embed color #hexcolor`\nExemple: #FF0000' },
            { name: 'Footer', value: '`config embed footer Votre texte de footer`' },
            { name: 'Thumbnail', value: '`config embed thumbnail url`\nExemple: https://example.com/image.png' }
        )
        .setTimestamp()
        .setFooter({ text: client.config.embed.footer });

    message.reply({ embeds: [embed] });
}

function sendBotHelp(message, client) {
    const embed = new EmbedBuilder()
        .setColor(client.config.embed.color)
        .setTitle('🤖 Configuration du Bot')
        .addFields(
            { name: 'Préfixe', value: '`config bot prefix symbol`\nExemple: !' },
            { name: 'Status', value: '`config bot status status`\nValeurs: online, idle, dnd, invisible' },
            { name: 'Activité', value: '`config bot activity Votre texte`' },
            { name: 'Type d\'activité', value: '`config bot activitytype type`\nValeurs: PLAYING, WATCHING, LISTENING, COMPETING' }
        )
        .setTimestamp()
        .setFooter({ text: client.config.embed.footer });

    message.reply({ embeds: [embed] });
}