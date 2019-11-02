const fs = require("fs");
const Koa = require("koa");
const IP = require('ip');
const http = require("http");
const https = require("https");
const static = require("koa-static");
const cors = require("koa2-cors");
const cookieSession = require("koa-session");
const convert = require("koa-convert");
const bodyParser = require("koa-better-body");
const compress = require("koa-compress");
const historyApiFallback = require('./utils/koa2-connect-history-api-fallback');
const enforceHttps = require("koa-sslify");
const hostName = require('./config').host;
const app = new Koa();
const proxy = require('koa-server-http-proxy')

// app.use(proxy('/qthmb', {
//   target: `https://${hostName}`,
//   pathRewrite: { '/qthmb': '' },
//   changeOrigin: true
// }))

const isProd = process.env.HOSTNAME && process.env.HOSTNAME === hostName;
isProd && app.use(enforceHttps()) //上线强制https



const greenlock = require("greenlock-express").create({
    version: "draft-11",
    server: "https://acme-v02.api.letsencrypt.org/directory",
    email: "bestwishtous@gmail.com",
    agreeTos: true,
    approveDomains: [hostName.split('.').slice(1).join('.'), hostName],
    communityMember: true,
    telemetry: true,
    configDir: require("os").homedir() + "/acme/etc",
    debug: false
});



//如果访问的是文件夹，自动补全/符号
const checkTrailingSlash = ctx => {
    const trailingSlash = ctx.path[ctx.path.length - 1] === '/';
    let path = "./static" + ctx.path;
    if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
        if (!trailingSlash) {
            ctx.response.redirect(ctx.path + '/')
        }
    };
}




// 全局错误处理   注意await不能断 若中间件前没用await，promise链会断开，中间件内部错误不能捕获，如路由里的中间函数invoke

app.use(async (ctx, next) => {

    try {
        checkTrailingSlash(ctx);
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit("error", err, ctx);
    }
});

app.on("error", (err, ctx) => {
    //捕获异常记录错误日志
    console.log("<===========res===========>");
    console.log(new Date().toLocaleString(), ":", err);
});


// app.use(historyApiFallback({
//     rewrites: [{
//             from: /\/qth\/?$/,
//             to: '/qth/index.html'
//         },
//         {
//             from: /\/qthmb\/?$/,
//             to: '/qthmb/index.html'
//         },
//         {
//             from: /\/qthpc\/?$/,
//             to: '/qthpc/index.html'
//         },
//          {
//             from: /\/react\/?$/,
//             to: '/react/index.html'
//         }
//     ]
// }));


//处理post请求 以及文件上传 包括formdata  data在ctx.request.fields
app.use(
    convert(
        bodyParser({
            uploadDir: "./static/upload", //指定上传路径
            keepExtensions: true, //保留扩展名
            fields: "body" //挂载到body上 ctx.requert.body
        })
    )
);

// 设置gzip
app.use(
    compress({
        threshold: 2048,
        flush: require("zlib").Z_SYNC_FLUSH
    })
);

//跨域
app.use(cors());

//session
app.keys = ["some secret hurr"];

app.use(
    cookieSession({
            key: "koa:sess", //cookie key (default is koa:sess)
            maxAge: 86400000, // cookie的过期时间 maxAge in ms (default is 1 days)
            overwrite: true, //是否可以overwrite    (默认default true)
            httpOnly: true, //cookie是否只有服务器端可以访问 httpOnly or not (default true)
            signed: true, //签名默认true
            rolling: false, //在每次请求时强行设置cookie，这将重置cookie过期时间（默认：false）
            renew: false //(boolean) renew session when session is nearly expired,
        },
        app
    )
);
//静态资源
app.use(static(__dirname + "/static")); 
require("./services")(app);//路由及数据库初始化
app.use(ctx => {
    if (ctx.path === "/favicon.ico") return;
    console.log(ctx.path)

    let n = ctx.session.views || 0;
    ctx.session.views = ++n;
    ctx.body = n + " views";
});
http.createServer(
    greenlock.middleware(app.callback())
).listen(80, () => {
    let msg = isProd ? "Listening on port 80 to handle ACME http-01 challenge and redirect to https" : `Listening at http://${IP.address()}:80`;
    console.log(msg);
});

isProd && https.createServer(
    greenlock.tlsOptions,
    greenlock.middleware(app.callback())
).listen(443, () => {
    console.log(`Listening at https://${IP.address()}`);
});