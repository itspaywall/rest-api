const amqp = require("amqplib");
async function sendMessage(queue, source, destination, subject, body) {
    const message = {
        queue: queue,
        source: source,
        destination: destination,
        subject: subject,
        body: body,
    };
    const QUEUE_NAME = queue;
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    const payload = JSON.stringify(message);
    await channel.sendToQueue(
        QUEUE_NAME,
        Buffer.from(payload, { persistent: true })
    );
    console.log(`Placed a message on the ${QUEUE_NAME} channel.`);

    /* If the connection is not closed, the process continues to live.
     * Therefore, close the connection to terminate the process.
     */
    await channel.close();
    await connection.close();
}
module.exports = {
    sendMessage,
};
