# 🦅 Crow Bot

![Version](https://img.shields.io/badge/version-1.2.5-blue.svg?style=flat-square)
![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2.svg?style=flat-square&logo=discord)
![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)

**Crow Bot** est un bot Discord sophistiqué développé en JavaScript. Il intègre un système de modération avancé avec base de données, des outils d'administration dynamiques, des cartes de bienvenue générées via Canvas et des fonctionnalités anti-raid.

---

## ✨ Fonctionnalités Principales

### 🛡️ Modération Avancée & Sanctions
- **Système de base de données (SQLite)** : Suivi complet de l'historique des sanctions (warns, mutes, bans) par utilisateur.
- **Gestion des sanctions** : Avertissements, expulsions, bannissements (avec durée), et mutes temporaires.
- **Logs détaillés** : Traçabilité des actions de modération dans des salons dédiés.

### 🎨 Accueil Personnalisé
- **Canvas** : Génération automatique d'une image de bienvenue stylisée avec l'avatar et le pseudo du nouveau membre.
- **Message privé** : Envoi automatique d'un message d'accueil en DM.

### 🔒 Anti-Raid & Sécurité
- **Lock/Unlock** : Verrouillage d'urgence des salons.
- **Whitelist** : Système de liste blanche pour sécuriser les commandes critiques (propriétaire/admin).

### ⚙️ Configuration Dynamique
- **Commande Config** : Modifiez les paramètres du bot (préfixe, status, salons de logs, couleurs embed) directement depuis Discord sans redémarrer.

### 🛠️ Utilitaires
- **FindUser** : Localisez un utilisateur dans les salons vocaux avec options de déplacement interactives (boutons).
- **Snipe** : Récupérez le dernier message supprimé.

---

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (v16.11.0 ou supérieur)
- [npm](https://www.npmjs.com/)
- Une base de données SQLite (gérée automatiquement par le bot)
- Un token de bot Discord

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-username/crow-bot.git
   cd crow-bot
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```
   *Note : L'installation de `canvas` et `sqlite3` peut nécessiter des outils de build (Python, Visual Studio Build Tools sur Windows).*

3. **Configuration**
   Remplissez le fichier `config.json` à la racine :
   ```json
   {
     "bot": {
       "token": "VOTRE_TOKEN_ICI",
       "prefix": "&",
       "activity": "Crow Bot",
       "activityType": "Watching",
       "status": "dnd"
     },
     "embed": {
       "color": "#FF0000",
       "footer": "Crow Bot - Made with ❤️",
       "thumbnail": "URL_IMAGE"
     },
     "logs": {
       "enabled": true,
       "channels": {
         "error": "ID_SALON_ERREUR",
         "command": "ID_SALON_LOGS_COMMANDES",
         "welcome": "ID_SALON_BIENVENUE"
       }
     },
     "whitelist": {
       "enabled": true,
       "users": ["VOTRE_ID_UTILISATEUR"]
     }
   }
   ```

4. **Démarrage**
   ```bash
   npm start
   ```

---

## 📚 Liste des Commandes

### 🛡️ Modération
| Commande | Usage | Description |
| :--- | :--- | :--- |
| `ban` | `ban @user [raison] [--days n]` | Bannir un utilisateur (option suppression messages). |
| `unban` | `unban <ID> [raison]` | Débannir un utilisateur via son ID. |
| `kick` | `kick @user [raison]` | Expulser un utilisateur. |
| `mute` | `mute @user <durée> [raison]` | Rendre muet temporairement (ex: 10m, 1h). |
| `unmute` | `unmute @user [raison]` | Rendre la parole à un membre. |
| `warn` | `warn @user [raison]` | Donner un avertissement (enregistré en DB). |
| `sanctions` | `sanctions [@user]` | Voir l'historique des sanctions (serveur ou membre). |
| `clear` | `clear <nombre>` | Supprimer un nombre de messages. |
| `addrole` | `addrole @user @role` | Ajouter un rôle à un membre. |
| `nuke` | `nuke [#salon]` | Recréer entièrement un salon (efface tout). |
| `finduser` | `finduser <nom/id>` | Trouver un utilisateur en vocal + boutons de déplacement. |

### 🔒 Anti-Raid
| Commande | Usage | Description |
| :--- | :--- | :--- |
| `lock` | `lock [#salon]` | Verrouille le salon (empêche de parler). |
| `unlock` | `unlock [#salon]` | Déverrouille le salon. |

### 🛠️ Utilitaires
| Commande | Usage | Description |
| :--- | :--- | :--- |
| `help` | `help [commande]` | Affiche la liste des commandes ou l'aide détaillée. |
| `ping` | `ping` | Affiche la latence du bot et de l'API. |
| `snipe` | `snipe` | Affiche le dernier message supprimé dans le salon. |
| `prix` | `prix` | Affiche les tarifs des services. |

### 👑 Propriétaire (Whitelist)
| Commande | Usage | Description |
| :--- | :--- | :--- |
| `config` | `config <catégorie> <param> <valeur>` | Modifier la configuration du bot en temps réel. |
| `wl` | `wl <add/remove/list> <id>` | Gérer la liste blanche des utilisateurs. |

---

## 📂 Structure du Projet

```
crow-bot/
├── commands/           # Dossier des commandes
│   ├── antiraid/      # Commandes de sécurité
│   ├── moderation/    # Commandes de modération
│   ├── owner/         # Commandes administrateur
│   └── utility/       # Commandes utilitaires
├── database/          # Gestion SQLite
│   ├── sanctions.db   # Fichier de base de données (généré)
│   └── sanctionsManager.js
├── events/            # Gestionnaires d'événements
│   ├── client/        # Ready, etc.
│   └── guild/         # Messages, Arrivées, etc.
├── config.json        # Configuration principale
├── index.js           # Point d'entrée
└── package.json       # Dépendances
```

## 🤝 Contribution

Les contributions sont les bienvenues !
1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📜 Licence

Distribué sous la licence MIT.

---
*Développé avec ❤️ par 3t6*