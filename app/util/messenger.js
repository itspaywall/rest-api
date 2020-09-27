const amqp = require("amqplib/callback_api");

function sendMessage(queue, source, destination, subject, body) {
    const message = {
        queue: queue,
        source: source,
        destination: destination,
        subject: subject,
        body: body,
    };
    let connectionStatus = new Promise((response, reject) => {
        amqp.connect("amqp://localhost", (connectionError, connection) => {
            if (connectionError) {
                return reject(connectionError);
            }

            connection.createChannel((channelError, channel) => {
                if (channelError) {
                    return reject(channelError);
                }
                const queue = message["queue"];
                channel.assertQueue(queue, { durable: true });

                payload = JSON.stringify(message);
                channel.sendToQueue(
                    queue,
                    Buffer.from(payload, { persistent: true })
                );
                console.log(`Enqueued a message on queue : ${queue}`);
            });
        });
    });
    return connectionStatus;
}

module.exports = {
    sendMessage,
};
