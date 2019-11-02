const {
    invoke
} = require('../com.js');
const {
    dbName
} = require('./config.js');
const router = require('koa-router')({
    prefix: `/${dbName}`
});

router.get("/:object/:method", async (ctx, next) => {
    await invoke(`./${dbName}/interfaces/`, ctx, next)
});

router.post("/:object/:method", async (ctx, next) => {
    await invoke(`./${dbName}/interfaces/`, ctx, next)
});

module.exports = router