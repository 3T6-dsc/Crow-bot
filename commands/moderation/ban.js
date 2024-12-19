// commands/moderation/ban.js

const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bannit un utilisateur.',
    async execute(message, args) {
        // Vérifiez si l'utilisateur a la permission de bannir des membres
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply({ content: 'Tu n\'as pas la permission de bannir des membres.', ephemeral: true });
        }

        // Récupérez l'utilisateur mentionné
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply({ content: 'Tu dois mentionner un utilisateur à bannir.', ephemeral: true });
        }

        const member = message.guild.members.resolve(user);
        if (member) {
            try {
                // Envoyer un message privé à l'utilisateur avant de le bannir
                await user.send({
                    content: 'Vous avez été banni de notre serveur Discord. Si vous pensez que cela est une erreur, veuillez contacter un administrateur.',
                    embeds: [new EmbedBuilder().setTitle('Bannissement').setDescription('Vous avez été banni du serveur.')]
                });

                // Bannir l'utilisateur
                await member.ban();
                await message.reply({ content: `L'utilisateur ${user.username} a été banni.`, ephemeral: true });
            } catch (err) {
                console.error('Erreur lors du bannissement :', err);
                await message.reply({ content: 'Je n\'ai pas pu bannir cet utilisateur ou envoyer un message privé.', ephemeral: true });
            }
        } else {
            await message.reply({ content: 'Cet utilisateur n\'est pas dans le serveur.', ephemeral: true });
        }
    },
};
