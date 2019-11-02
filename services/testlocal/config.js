const {
    dbConfig
} = require('../../config.js');
module.exports = {
    ...dbConfig,
    dbName: 'testlocal',
    username: '',
    password: '',
}