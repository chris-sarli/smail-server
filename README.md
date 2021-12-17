# smail-server

A simple SMTP/Smail server. This server expects to be used for one account on one domain, but can be extended to multiple accounts and domains.

## Running

After cloning the repository, you should run `cp docker-compose.yml.example docker-compose.yml` from within the repository's root directory. You can use the example values as a guide for configuration values, and in order to get values for some environment variables (`CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, and `OIDC_ISSUER`) you will need to generate credentials for your Solid identity using [these instructions for a single-user script](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-nodejs/#node-js-script-single-user-script).

After you've edited the values and assuming you have Docker (and Docker's compose) installed, you should be able to run `docker-compose up` to start the server.

**NOTE:** Most virtual private server hosts and internet service providers will block the ports used for SMTP by default in order to reduce spam. You may need to contact your respective entity in order to get these unblocked.
