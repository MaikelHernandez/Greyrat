require("dotenv").config();

const env = process.env;

class Auth {
    
    static TOKEN = env.TOKEN;
    static CLIENT_ID = env.CLIENT_ID;

    static DB_NAME = env.DB_NAME;
}

module.exports = {
    Auth
};
