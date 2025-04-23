const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        
        // Définir l'activité et le statut du bot
        client.user.setActivity(client.config.bot.activity, { 
            type: ActivityType[client.config.bot.activityType] 
        });
        client.user.setStatus(client.config.bot.status);

        // Générer le lien d'invitation avec les permissions nécessaires
        const inviteLink = client.generateInvite({
            scopes: ['bot'],
            permissions: [
                'Administrator',              // Pour une configuration facile, vous pouvez ajuster selon vos besoins
                'SendMessages',
                'ManageMessages',
                'ReadMessageHistory',
                'ViewChannel',
                'EmbedLinks',
                'AttachFiles',
                'UseExternalEmojis',
                'AddReactions'
            ]
        });

        // Afficher les informations de démarrage dans la console
        console.log('╔════════════════════════════════════════╗');
        console.log('║           Crow Bot est en ligne!       ║');
        console.log('╠════════════════════════════════════════╣');
        console.log('║ Lien d\'invitation du bot:              ║');
        console.log(`║ ${inviteLink}`);
        console.log('╚════════════════════════════════════════╝');
    }
};


