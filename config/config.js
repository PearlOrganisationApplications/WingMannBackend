const crypto = require('crypto');


const JWT_SECRET = crypto.randomBytes(64).toString('hex');

module.exports = {
    JWT_SECRET
};