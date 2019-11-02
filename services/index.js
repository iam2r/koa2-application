const {
    initSchemas,
    initRouter,
    syncDirectory
} = require('./com.js');

module.exports = async (app) => {
    let schemasFuc = [];
    //装载所有子路由
    syncDirectory(__dirname).forEach(path => {
        let dbName = path.split('/').pop();
        initRouter(app, require(path + '/router.js'));
        schemasFuc.push(initSchemas(dbName))
    })
    //连接所有数据库并装载表
    Promise.all(schemasFuc)
};