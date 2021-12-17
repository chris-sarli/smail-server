const { CONFIG, DIRECTORY_URLS, ADDRESS } = require("./config");

const { Session } = require("@inrupt/solid-client-authn-node");
require('fs');
const nodemailer = require("nodemailer");

const {
    getSolidDataset,
    getThing,
    setThing,
    getInteger,
    getBoolean,
    getStringNoLocale,
    setStringNoLocale,
    saveSolidDatasetAt,
    getThingAll,
    getFile,
    overwriteFile,
} = require("@inrupt/solid-client");

const { SMAIL } = require('./SMAIL.js');

const session = new Session();
session.login(CONFIG.secrets).then(() => {
    if (session.info.isLoggedIn) {
        console.log("LOGGED IN ✅")
    }
});
const SESSION_FETCH = { fetch: session.fetch }

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: "smail.chris.sarl",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: ADDRESS,
        pass: "test",
    },
});

async function sendMessage(message_url) {
    let message_dataset = await getSolidDataset(message_url, SESSION_FETCH);
    const message_thing = getThing(message_dataset, message_url);
    const recipients = getStringNoLocale(message_thing, SMAIL.to);
    const body = getStringNoLocale(message_thing, SMAIL.body);
    const subject = getStringNoLocale(message_thing, SMAIL.subject);
    const messageId = getStringNoLocale(message_thing, SMAIL.messageId);

    console.log(`Detected message ${messageId} in outbox. Sending...`);

    // send mail with defined transport object
    await transporter.sendMail({
        from: ADDRESS, // sender address
        to: recipients, // list of receivers
        subject: subject, // Subject line
        text: body, // plain text body
        messageId: messageId
    });

    console.log(`Sent message ${messageId}. Updating Solid copy at ${message_url}.`);
    await moveMessageToDir(message_url, DIRECTORY_URLS["sent"]);
}

async function sendOutbox() {
    getFile(DIRECTORY_URLS['outbox'], SESSION_FETCH).then(blob => {
        blob.text().then(text => {
            Object.keys(JSON.parse(text)["contents"])
                .forEach(async (url) => {
                    await sendMessage(url)
                });
        });
    });
}

async function removeMessageFromDir(message, dir) {
    const blob = await getFile(dir, SESSION_FETCH);
    blob.text().then(async (text) => {
        const contents = JSON.parse(text)['contents'];
        if (message in contents) {
            delete contents[message];
            return overwriteFile(
                dir,
                Buffer.from(JSON.stringify({ contents: contents })),
                { contentType: "application/json", fetch: SESSION_FETCH['fetch'] });
        }
    });
}

async function addMessageToDirIndex(message, message_thing, dir) {
    console.log("addMessageToDirIndex for dir", dir);
    return getFile(dir, SESSION_FETCH).then(blob => {
        blob.text().then(async (text) => {
            const contents = JSON.parse(text)['contents']
            if (!(message in contents)) {
                contents[message] = {
                    timestamp: getInteger(message_thing, SMAIL.timestamp),
                    is_read: getBoolean(message_thing, SMAIL.is_read),
                    subject: getStringNoLocale(message_thing, SMAIL.subject),
                    from: getStringNoLocale(message_thing, SMAIL.from),
                    to: getStringNoLocale(message_thing, SMAIL.to),
                }
                return overwriteFile(
                    dir,
                    Buffer.from(JSON.stringify({ contents: contents })),
                    { contentType: "application/json", fetch: SESSION_FETCH['fetch'] })
            }
        })
    })
}

async function moveMessageToDir(message, dir) {
    let message_dataset = await getSolidDataset(message, SESSION_FETCH);
    let message_thing = getThingAll(message_dataset, message, SESSION_FETCH)[0];
    const current_dir = getStringNoLocale(message_thing, SMAIL.directory);

    message_thing = setStringNoLocale(message_thing, SMAIL.directory, dir);
    message_dataset = setThing(message_dataset, message_thing);

    return Promise.all(
        [saveSolidDatasetAt(message, message_dataset, SESSION_FETCH),
        removeMessageFromDir(message, current_dir),
        addMessageToDirIndex(message, message_thing, dir)]);
}

module.exports = { sendOutbox }