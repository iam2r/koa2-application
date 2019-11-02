const {
    connect
} = require('../com.js');
const {
    host,
    dbName
} = require('./config.js');

module.exports = connect(host, dbName);