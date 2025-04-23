const { Collection } = require('discord.js');

// Créer une collection statique
const snipes = new Collection();

module.exports = {
    name: 'messageDelete',
    execute(message) {
        // Vérifications de base
        if (!message || !message.content || !message.author || message.author.bot) return;

        // Stocker directement avec une clé unique par canal
        snipes.set(message.channel.id, {
            content: message.content,
            author: message.author,
            timestamp: Date.now()
        });

        // Supprimer après 5 minutes
        setTimeout(() => {
            snipes.delete(message.channel.id);
        }, 300000); // 5 minutes
    }
};

// Exporter la collection pour y accéder depuis d'autres fichiers
module.exports.snipes = snipes;

