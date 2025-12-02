const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const GuildSettingsManager = require('../../database/guildSettingsManager');

module.exports = {
    name: 'antilink',
    description: 'Configure le système anti-lien via un panneau interactif',
    usage: '',
    permissions: ['Administrator'],
    category: 'antiraid',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Vous devez être administrateur pour configurer l'anti-lien.");
        }

        // Récupérer l'état actuel
        let settings = await GuildSettingsManager.getSettings(message.guild.id);
        let isEnabled = settings.antilink_enabled === 1;

        // Fonction pour générer l'embed et les boutons
        const generatePanel = (enabled) => {
            const statusColor = enabled ? '#00FF00' : '#FF0000';
            const statusText = enabled ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌';
            const description = enabled 
                ? "Le système anti-lien est actuellement **activé**.\nTout lien posté par un membre non-admin sera automatiquement supprimé."
                : "Le système anti-lien est actuellement **désactivé**.\nLes membres peuvent poster des liens librement.";

            const embed = new EmbedBuilder()
                .setColor(statusColor)
                .setTitle('🛡️ Configuration Anti-Lien')
                .setDescription(description)
                .addFields({ name: 'Statut', value: `**${statusText}**`, inline: true })
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('enable_antilink')
                        .setLabel('Activer')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(enabled),
                    new ButtonBuilder()
                        .setCustomId('disable_antilink')
                        .setLabel('Désactiver')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(!enabled)
                );

            return { embeds: [embed], components: [row] };
        };

        const msg = await message.reply(generatePanel(isEnabled));

        // Création du collecteur
        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'enable_antilink') {
                await GuildSettingsManager.setAntilink(message.guild.id, true);
                isEnabled = true;
            } else if (interaction.customId === 'disable_antilink') {
                await GuildSettingsManager.setAntilink(message.guild.id, false);
                isEnabled = false;
            }

            await interaction.update(generatePanel(isEnabled));
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('expired_1')
                        .setLabel('Activer')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('expired_2')
                        .setLabel('Désactiver')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );
            msg.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};