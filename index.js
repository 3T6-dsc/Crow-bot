const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const SanctionsManager = require('./database/sanctionsManager');

// Vérification du token au démarrage
console.log('Token length:', config.bot.token.length);
console.log('Token starts with:', config.bot.token.substring(0, 10) + '...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
client.config = config;

// Chargement des événements
const loadEvents = (dir = './events') => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const path = `${dir}/${file}`;
        const stat = fs.statSync(path);
        
        if (stat.isDirectory()) {
            loadEvents(path);
        } else if (file.endsWith('.js')) {
            const event = require(path);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            console.log(`Événement chargé: ${event.name}`);
        }
    }
};

loadEvents();

// Chargement des commandes
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
        console.log(`Commande chargée: ${command.name}`);
    }
}

// Login avec gestion d'erreur
client.login(config.bot.token)
    .then(() => {
        console.log('Bot connecté avec succès!');
    })
    .catch(error => {
        console.error('Erreur de connexion:', error);
        console.log('Token utilisé:', config.bot.token);
    });

// Au démarrage du bot
client.once('ready', async () => {
    try {
        await SanctionsManager.init();
        console.log('Base de données des sanctions initialisée');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
    }
    console.log('Bot prêt !');
});


