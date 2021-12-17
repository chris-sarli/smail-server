const { CONFIG, MAILBOX_DIR, MESSAGES_URL, DIRECTORIES_URL, DIRECTORY_URLS } = require("./config");

const { Session } = require("@inrupt/solid-client-authn-node");
const { simpleParser } = require('mailparser');

const { setThing, saveSolidDatasetAt, createThing, createSolidDataset, addStringNoLocale, createContainerAt, addInteger, getFile, overwriteFile, addBoolean } = require("@inrupt/solid-client");

const { SMAIL } = require('./SMAIL.js');
const { readFileSync, readdirSync, rmSync } = require("fs");

const session = new Session();
const SESSION_FETCH = {}
session.login(CONFIG['secrets']).then(() => {
    SESSION_FETCH['fetch'] = session.fetch;
    if (session.info.isLoggedIn) {
        [MESSAGES_URL, DIRECTORIES_URL].forEach(url => createContainerAt(url, SESSION_FETCH));

        Object.values(DIRECTORY_URLS).forEach(async (url) => {
            await getFile(url, SESSION_FETCH).catch(async (_) => {
                await overwriteFile(url, Buffer.from(JSON.stringify({ contents: {} })),
                    { contentType: "application/json", fetch: SESSION_FETCH['fetch'] });
            });
        })
    }
});

async function parseMessageFile(file) {
    let source = readFileSync(file);
    let parsed = await simpleParser(source);

    return {
        timestamp: parsed['date'],
        from: parsed['from']['value'],
        recipients: parsed['to']['value'],
        subject: parsed['subject'],
        text: parsed['text'],
        messageId: parsed['messageId'],
        replyingTo: parsed['inReplyTo'],
    }
}

function removeFile(path) {
    rmSync(path);
}

function processNewMessages() {

    const dir = CONFIG.storage_dir + MAILBOX_DIR + "new/";

    try {
        const files = readdirSync(dir);

        files.forEach(function (file) {
            parseMessageFile(dir + file).then(resolved => addToInbox(resolved)).then(_ => removeFile(dir + file)).catch(e => console.error(e));
        });

    } catch (err) {
        console.log(err);
    }
}

module.exports = { processNewMessages }

async function addMessageToDirIndex(message, dir, timestamp, is_read, subject, from, to) {
    getFile(dir, SESSION_FETCH).then(blob => {
        blob.text().then(async (text) => {
            const contents = JSON.parse(text)['contents']
            if (!(message in contents)) {
                contents[message] = {
                    timestamp: timestamp,
                    is_read: is_read,
                    subject: subject,
                    from: from,
                    to: to
                }
                return overwriteFile(
                    dir,
                    Buffer.from(JSON.stringify({ contents: contents })),
                    { contentType: "application/json", fetch: SESSION_FETCH['fetch'] })
            }
        })
    })
}

async function addToInbox(msg) {

    // Create the URL for the new message. This will be constant, unless the message is deleted entirely.
    let newMessageUrl = MESSAGES_URL + msg.messageId.slice(1, -1);

    // Create the new Thing for the message, using the message's ID as the name.
    let newMessage = createThing({ name: msg.messageId, url: newMessageUrl });

    // Add all of the message-specific content to the Thing:
    newMessage = addStringNoLocale(newMessage, SMAIL.messageId, msg.messageId);
    newMessage = addStringNoLocale(newMessage, SMAIL.from, JSON.stringify(msg.from));
    newMessage = addStringNoLocale(newMessage, SMAIL.to, JSON.stringify(msg.recipients));
    newMessage = addStringNoLocale(newMessage, SMAIL.subject, msg.subject);
    newMessage = addInteger(newMessage, SMAIL.timestamp, msg.timestamp.getTime());
    newMessage = addStringNoLocale(newMessage, SMAIL.body, msg.text);
    if ('replyingTo' in msg) {
        newMessage = addStringNoLocale(newMessage, SMAIL.replyingTo, msg.replyingTo);
    }

    // Defaults for newly recieved emails
    newMessage = addBoolean(newMessage, SMAIL.is_read, false);
    newMessage = addStringNoLocale(newMessage, SMAIL.directory, DIRECTORY_URLS['inbox']);
    newMessage = addBoolean(newMessage, SMAIL.is_authored, false);

    let newMessageDataset = setThing(createSolidDataset(), newMessage);

    return Promise.all([saveSolidDatasetAt(newMessageUrl, newMessageDataset, SESSION_FETCH),
    addMessageToDirIndex(newMessageUrl, DIRECTORY_URLS['inbox'], msg.timestamp.getTime(), false, msg.subject, msg.from, msg.recipients)]);
}