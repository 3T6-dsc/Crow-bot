# 🤖 Crow Bot

Un bot Discord polyvalent et puissant développé en JavaScript avec discord.js, offrant des fonctionnalités de modération, d'administration et d'utilitaires.

## ✨ Fonctionnalités

- 🛡️ **Modération**: Gestion des membres, messages, et infractions
- ⚙️ **Administration**: Configuration du serveur et des paramètres du bot
- 🛠️ **Utilitaires**: Commandes pratiques pour les utilisateurs
- 📊 **Embeds**: Création d'embeds personnalisés
- 🔒 **Système de permissions**: Gestion fine des accès aux commandes
- ⚡ **Performance**: Temps de réponse optimisé
- 🔧 **Configuration flexible**: Personnalisation via config.json

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (v16.11.0 ou supérieur)
- [npm](https://www.npmjs.com/) (inclus avec Node.js)
- Un [token de bot Discord](https://discord.com/developers/applications)

## 🚀 Installation

1. Clonez le repository :
```bash
git clone https://github.com/3T6-dsc/Crow-bot.git
cd Crow-bot
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez le bot :
   - Renommez `config.example.json` en `config.json`
   - Modifiez le fichier avec vos paramètres :
```json
{
    "bot": {
        "token": "VOTRE_TOKEN_ICI",
        "prefix": "!",

    }
```

4. Démarrez le bot :
```bash
npm start
```

## 📝 Commandes

### Modération
- `!ban`: Bannir un membre
- `!kick`: Expulser un membre
- `!mute`: Rendre muet un membre
- `!clear`: Supprimer des messages

### Utilitaires
- `!embed`: Créer un embed personnalisé
- `!help`: Afficher l'aide
- `!ping`: Vérifier la latence
- `!serverinfo`: Informations sur le serveur

### Administration
- `!config`: Configurer le bot
- `!prefix`: Changer le préfixe
- `!setup`: Configuration initiale

## 🔧 Configuration

Le fichier `config.json` permet de personnaliser :
- Token du bot
- Préfixe des commandes
- Couleur des embeds
- Message de statut
- Footer des embeds
- Liste blanche des utilisateurs
- Et plus encore...

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📜 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

## 📞 Support

Pour obtenir de l'aide ou signaler un bug :
- Ouvrez une [issue](https://github.com/votre-username/crow-bot/issues)
- Rejoignez notre [serveur Discord](votre-lien-discord)

## ⭐ Remerciements

- [discord.js](https://discord.js.org/) pour leur excellent framework
- La communauté Discord pour leur soutien
- Tous les contributeurs qui améliorent ce projet

---
Développé avec ❤️ par 3t6
