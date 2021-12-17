const { sendOutbox } = require("./outbound");
const { processNewMessages } = require("./inbound");

console.log("Smailer starting up...");
console.log("Environment Variables:", process.env);

setInterval(function () { sendOutbox(); }, 1000);
setInterval(function () { processNewMessages(); }, 5000)
