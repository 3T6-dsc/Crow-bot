const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

async function createWelcomeCard(member) {
    // Création d'une bannière plus large que haute
    const canvas = Canvas.createCanvas(1024, 200);
    const ctx = canvas.getContext('2d');

    // Fond sombre
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Avatar rond à gauche
    ctx.save();
    ctx.beginPath();
    const avatarSize = 150;
    const avatarX = 25;
    const avatarY = (canvas.height - avatarSize) / 2;
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Nom d'utilisateur
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    const usernameX = avatarX + avatarSize + 30;
    ctx.fillText(member.user.username, usernameX, 80);

    // Texte "Bienvenue sur"
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#72767D';
    ctx.fillText(`Bienvenue sur ${member.guild.name}`, usernameX, 130);

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-banner.png' });
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        if (!client.config.logs.enabled || !client.config.logs.channels.welcome) return;

        const welcomeChannel = member.guild.channels.cache.get(client.config.logs.channels.welcome);
        if (!welcomeChannel) return;

        try {
            const attachment = await createWelcomeCard(member);

            const welcomeEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setDescription(`👋 Hey ${member}, bienvenue sur **${member.guild.name}** !
                    \n📊 Nous sommes maintenant **${member.guild.memberCount}** membres
                    \n🎉 Nous te souhaitons une excellente expérience parmi nous !`)
                .setImage('attachment://welcome-banner.png')
                .setTimestamp()
                .setFooter({ 
                    text: client.config.embed.footer,
                    iconURL: member.guild.iconURL({ dynamic: true })
                });

            const welcomeMessage = await welcomeChannel.send({
                embeds: [welcomeEmbed],
                files: [attachment]
            });

            await welcomeMessage.react('👋');

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setTitle(`Bienvenue sur ${member.guild.name} !`)
                    .setDescription(`👋 Merci de nous avoir rejoint !
                        \n📜 N'oublie pas de lire le règlement du serveur
                        \n❓ Si tu as des questions, n'hésite pas à contacter notre équipe de modération`)
                    .setImage('attachment://welcome-banner.png')
                    .setTimestamp()
                    .setFooter({ text: client.config.embed.footer });

                await member.send({
                    embeds: [dmEmbed],
                    files: [attachment]
                });
            } catch (error) {
                console.log(`Impossible d'envoyer un message privé à ${member.user.tag}`);
            }

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message de bienvenue:', error);
            
            if (client.config.logs.channels.error) {
                const errorChannel = member.guild.channels.cache.get(client.config.logs.channels.error);
                if (errorChannel) {
                    await errorChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('Erreur - Message de Bienvenue')
                                .setDescription(`Une erreur est survenue lors de l'envoi du message de bienvenue pour ${member.user.tag}\n\n\`\`\`${error.message}\`\`\``)
                                .setTimestamp()
                                .setFooter({ text: client.config.embed.footer })
                        ]
                    });
                }
            }
        }
    }
};

