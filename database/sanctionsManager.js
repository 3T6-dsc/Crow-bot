const { Database } = require('sqlite3');
const db = new Database('./database/sanctions.db');

class SanctionsManager {
    static db = db;

    // Initialisation de la base de données
    static async init() {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(`
                    CREATE TABLE IF NOT EXISTS sanctions (
                        sanction_number INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        guild_id TEXT NOT NULL,
                        type TEXT NOT NULL,
                        reason TEXT NOT NULL,
                        moderator_id TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        duration INTEGER
                    )
                `, (err) => {
                    if (err) {
                        console.error('Erreur lors de la création de la table:', err);
                        reject(err);
                    } else {
                        console.log('Table sanctions initialisée avec succès');
                        resolve();
                    }
                });
            });
        });
    }

    // Fonction utilitaire pour obtenir le prochain numéro de sanction
    static async getNextSanctionNumber(userId, guildId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT MAX(sanction_number) as max_num FROM sanctions WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve((row.max_num || 0) + 1);
                }
            );
        });
    }

    // Ajouter un avertissement
    static async addWarn(userId, guildId, reason, moderatorId) {
        return new Promise(async (resolve, reject) => {
            try {
                const sanctionNumber = await this.getNextSanctionNumber(userId, guildId);
                db.run(
                    'INSERT INTO sanctions (user_id, guild_id, sanction_number, type, reason, moderator_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, guildId, sanctionNumber, 'warn', reason, moderatorId, Date.now()],
                    function(err) {
                        if (err) reject(err);
                        else resolve(sanctionNumber);
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    }

    // Ajouter un ban
    static async addBan(userId, guildId, reason, moderatorId) {
        return new Promise(async (resolve, reject) => {
            try {
                const sanctionNumber = await this.getNextSanctionNumber(userId, guildId);
                db.run(
                    'INSERT INTO sanctions (user_id, guild_id, sanction_number, type, reason, moderator_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, guildId, sanctionNumber, 'ban', reason, moderatorId, Date.now()],
                    function(err) {
                        if (err) reject(err);
                        else resolve(sanctionNumber);
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    }

    // Ajouter un mute
    static async addMute(userId, guildId, reason, moderatorId, duration) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sanctions (user_id, guild_id, type, reason, moderator_id, duration)
                VALUES (?, ?, 'MUTE', ?, ?, ?)
            `;
            
            db.run(query, [userId, guildId, reason, moderatorId, duration], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Récupérer une sanction spécifique
    static async getSanction(userId, guildId, sanctionNumber) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM sanctions WHERE user_id = ? AND guild_id = ? AND sanction_number = ?',
                [userId, guildId, sanctionNumber],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    // Récupérer l'historique d'un utilisateur
    static async getUserHistory(userId, guildId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM sanctions 
                WHERE user_id = ? AND guild_id = ? 
                ORDER BY timestamp DESC`,
                [userId, guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        const history = {
                            warns: rows.filter(row => row.type === 'WARN'),
                            mutes: rows.filter(row => row.type === 'MUTE'),
                            bans: rows.filter(row => row.type === 'BAN')
                        };
                        resolve(history);
                    }
                }
            );
        });
    }

    // Récupérer l'historique du serveur
    static async getGuildHistory(guildId) {
        const query = `
            SELECT * FROM sanctions 
            WHERE guild_id = ?
            ORDER BY timestamp DESC
            LIMIT 100
        `;
        
        const [rows] = await this.db.execute(query, [guildId]);
        
        return {
            warns: rows.filter(row => row.type === 'WARN'),
            bans: rows.filter(row => row.type === 'BAN'),
            mutes: rows.filter(row => row.type === 'MUTE')
        };
    }

    // Supprimer une sanction
    static async removeSanction(userId, guildId, sanctionNumber) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM sanctions WHERE user_id = ? AND guild_id = ? AND sanction_number = ?',
                [userId, guildId, sanctionNumber],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}

module.exports = SanctionsManager;


