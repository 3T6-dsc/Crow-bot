const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'sanctions.db'), (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données SQLite établie');
    }
});

// Initialisation de la base de données avec gestion des erreurs
db.serialize(() => {
    // Création de la table sanctions si elle n'existe pas déjà
    db.run(`CREATE TABLE IF NOT EXISTS sanctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        sanction_number INTEGER NOT NULL,
        type TEXT NOT NULL,
        reason TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        active BOOLEAN DEFAULT true
    )`, (err) => {
        if (err) {
            console.error('Erreur lors de la création de la table sanctions:', err);
        } else {
            console.log('Table sanctions vérifiée/créée avec succès');
        }
    });
});

module.exports = db;


