module.exports = {
    name: 'ping',
    description: 'Répond avec Pong!',
    execute(message, args) {
        message.channel.send({content: 'Pong!'});
    },
};
