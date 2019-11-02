const fs = require('fs');
const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const {
    sync
} = require('glob');
const {
    resolve
} = require('path');

exports.connect = (host, dbName) => {
    let maxConnectTimes = 0;
    const dbPath = `mongodb://${host}/${dbName}`;
    const createConect = () => mongoose.createConnection(dbPath);
    let db = createConect();
    console.log(dbPath + ' connecting')
    return new Promise((resolve, reject) => {
        //增加数据库监听事件
        db.on('disconnected', () => {
            console.log('***********数据库断开***********')
            if (maxConnectTimes <= 3) {
                maxConnectTimes++
                db = createConect();
            } else {
                reject()
                throw new Error('数据库出现问题，程序无法搞定，请人为修理.....')
            }

        })
        db.on('error', (err) => {
            console.log('***********数据库错误')
            if (maxConnectTimes <= 3) {
                maxConnectTimes++
                db = createConect();
            } else {
                reject(err)
                throw new Error('数据库出现问题，程序无法搞定，请人为修理.....')
            }
        })
        //链接成功
        db.once('open', () => {
            console.log(dbPath + ' connected successfully')
            resolve(db)
        })
    })
}

exports.initSchemas = dbName => {
    sync(resolve(__dirname, dbName + '/schemas', '**/*.js')).forEach(require)
}

exports.syncDirectory = dir => {
    let children = [];
    fs.readdirSync(dir).forEach(filename => {
        const path = dir + "/" + filename;
        const stat = fs.statSync(path);
        if (stat && stat.isDirectory()) {
            children.push(path)
        }
    });
    return children
}

exports.initRouter = (app, router) => {
    app.use(router.routes()).use(router.allowedMethods());
}

exports.invoke = async (path, ctx, next) => { //统一获取无论get还是post请求的参数放到ctx.data上，并确定走对应的方法
    const {
        object,
        method
    } = ctx.params;
    console.log(`///invoke:${path}->${object}->${method}===${ctx.request.method}`);
    ctx.data = {
        ...ctx.query,
        ...ctx.request.body
    };
    console.log('<===========req===========>')
    console.log(ctx.data);



    ctx.body = await require(`${path}${object}`)[method](ctx, next); //返回结果
    console.log('<===========res===========>')
    console.log(ctx.body)
};