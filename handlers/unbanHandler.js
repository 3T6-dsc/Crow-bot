// handlers/unbanHandler.js

const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports.handleUnbanCommand = async (message) => {
    const bannedUsers = await message.guild.bans.fetch();
    const bannedUsersArray = Array.from(bannedUsers.values());

    if (bannedUsersArray.length === 0) {
        return message.reply('Aucun membre n\'est actuellement banni.');
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Liste des Membres Banniss')
        .setDescription('Veuillez choisir un membre à débannir en utilisant son ID.');

    bannedUsersArray.forEach((ban, index) => {
        embed.addFields({ name: `ID ${index + 1}`, value: `${ban.user.username} (ID: ${ban.user.id})` });
    });

    // Création des boutons pour chaque utilisateur banni
    const buttons = bannedUsersArray.map((ban, index) => 
        new ButtonBuilder()
            .setCustomId(`unban_${ban.user.id}`)
            .setLabel(`Débannir ${ban.user.username}`)
            .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    await message.reply({ embeds: [embed], components: [row] });
};
