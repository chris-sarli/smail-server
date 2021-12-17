const CONFIG = {
    "pod_url": process.env.POD_URL,
    "secrets": {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        oidcIssuer: process.env.OIDC_ISSUER
    },
    smail_dir: process.env.SMAIL_DIR,
    domain_name: process.env.DOMAIN_NAME,
    user: process.env.USER,
    storage_dir: process.env.STORAGE_DIR
}

// Root URL for Smail for this Pod
const SMAIL_URL = CONFIG.pod_url + CONFIG.smail_dir;

const MAILBOX_DIR = `${CONFIG.domain_name}/${CONFIG.user}/`
const ADDRESS = `${CONFIG.user}@${CONFIG.domain_name}`

// Location of a user mailbox
const MAILBOX_URL = SMAIL_URL + MAILBOX_DIR;


const MESSAGES_URL = MAILBOX_URL + "messages/";
const DIRECTORIES_URL = MAILBOX_URL + "dir/";
const DIRECTORY_URLS = {}
const dirs = ["inbox", "outbox", "archive", "drafts", "sent"]
dirs.forEach((dir) => {
    DIRECTORY_URLS[dir] = DIRECTORIES_URL + dir + ".json"
});

module.exports = {
    CONFIG,
    ADDRESS,
    SMAIL_URL,
    MAILBOX_DIR,
    MAILBOX_URL,
    MESSAGES_URL,
    DIRECTORIES_URL,
    DIRECTORY_URLS
}