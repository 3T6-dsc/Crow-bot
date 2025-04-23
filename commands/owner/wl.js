const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'wl',
    description: 'Gère la whitelist du bot',
    usage: '<add/remove/list> [@user/userID]',
    category: 'owner',
    ownerOnly: true,
    async execute(message, args, client) {
        // Fonction pour sauvegarder la config
        const saveConfig = () => {
            fs.writeFileSync('./config.json', JSON.stringify(client.config, null, 2));
        };

        // Embed d'erreur réutilisable
        const errorEmbed = (description) => {
            return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription(description)
                .setTimestamp();
        };

        // Vérifier si l'utilisateur est dans la whitelist
        if (!client.config.whitelist.users.includes(message.author.id)) {
            return message.reply({ 
                embeds: [errorEmbed("Vous devez être dans la whitelist pour utiliser cette commande.")] 
            });
        }

        if (!args[0]) {
            return message.reply({ 
                embeds: [errorEmbed("Usage: .wl <add/remove/list> [@user/userID]")] 
            });
        }

        const action = args[0].toLowerCase();

        switch (action) {
            case 'add': {
                if (!args[1]) {
                    return message.reply({ 
                        embeds: [errorEmbed("Veuillez spécifier un utilisateur.")] 
                    });
                }

                // Récupérer l'ID de l'utilisateur (soit par mention soit par ID direct)
                const userId = message.mentions.users.first()?.id || args[1].replace(/[<@!>]/g, '');

                // Vérifier si l'ID est valide
                try {
                    await client.users.fetch(userId);
                } catch (error) {
                    return message.reply({ 
                        embeds: [errorEmbed("ID d'utilisateur invalide.")] 
                    });
                }

                if (client.config.whitelist.users.includes(userId)) {
                    return message.reply({ 
                        embeds: [errorEmbed("Cet utilisateur est déjà dans la whitelist.")] 
                    });
                }

                client.config.whitelist.users.push(userId);
                saveConfig();

                const user = await client.users.fetch(userId);
                const embed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle('✅ Whitelist Mise à jour')
                    .setDescription(`L'utilisateur ${user.tag} (\`${userId}\`) a été ajouté à la whitelist.`)
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            case 'remove': {
                if (!args[1]) {
                    return message.reply({ 
                        embeds: [errorEmbed("Veuillez spécifier un utilisateur.")] 
                    });
                }

                // Récupérer l'ID de l'utilisateur (soit par mention soit par ID direct)
                const userId = message.mentions.users.first()?.id || args[1].replace(/[<@!>]/g, '');

                if (userId === client.config.whitelist.users[0]) {
                    return message.reply({ 
                        embeds: [errorEmbed("Vous ne pouvez pas retirer le propriétaire du bot de la whitelist.")] 
                    });
                }

                const index = client.config.whitelist.users.indexOf(userId);
                if (index === -1) {
                    return message.reply({ 
                        embeds: [errorEmbed("Cet utilisateur n'est pas dans la whitelist.")] 
                    });
                }

                client.config.whitelist.users.splice(index, 1);
                saveConfig();

                const user = await client.users.fetch(userId);
                const embed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle('✅ Whitelist Mise à jour')
                    .setDescription(`L'utilisateur ${user.tag} (\`${userId}\`) a été retiré de la whitelist.`)
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            case 'list': {
                const userList = await Promise.all(client.config.whitelist.users.map(async (id) => {
                    try {
                        const user = await client.users.fetch(id);
                        return `• ${user.tag} (\`${id}\`)`;
                    } catch {
                        return `• ID Invalide (\`${id}\`)`;
                    }
                }));

                const embed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle('📋 Whitelist')
                    .setDescription(userList.join('\n'))
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            default:
                return message.reply({ 
                    embeds: [errorEmbed("Action invalide. Utilisez 'add', 'remove' ou 'list'.")] 
                });
        }
    }
};


