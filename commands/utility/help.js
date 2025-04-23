const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Affiche la liste des commandes ou les détails d\'une commande spécifique',
    usage: '[commande]',
    permissions: [],
    execute(message, args, client) {
        const prefix = client.config.bot.prefix;

        // Si un argument est fourni, afficher l'aide pour cette commande spécifique
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName);

            if (!command) {
                return message.reply(`La commande \`${commandName}\` n'existe pas.`);
            }

            const embed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setTitle(`Aide pour la commande: ${command.name}`)
                .addFields(
                    { name: 'Description', value: command.description || 'Aucune description disponible' },
                    { name: 'Utilisation', value: `\`${prefix}${command.name} ${command.usage || ''}\`` }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            if (command.permissions && command.permissions.length > 0) {
                embed.addFields({ 
                    name: 'Permissions requises', 
                    value: command.permissions.join(', ') 
                });
            }

            return message.channel.send({ embeds: [embed] });
        }

        // Sinon, afficher la liste de toutes les commandes
        const categories = new Map();

        // Regrouper les commandes par catégorie (dossier)
        client.commands.forEach(command => {
            const category = command.category || 'Autre';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(command);
        });

        const embed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle('Liste des commandes')
            .setDescription(`Utilisez \`${prefix}help <commande>\` pour plus d'informations sur une commande spécifique.`)
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        // Ajouter chaque catégorie à l'embed
        categories.forEach((commands, category) => {
            const commandList = commands
                .map(cmd => `\`${cmd.name}\`${cmd.description ? ` - ${cmd.description}` : ''}`)
                .join('\n');
            
            embed.addFields({
                name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
                value: commandList
            });
        });

        message.channel.send({ embeds: [embed] });
    }
};