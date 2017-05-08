// @ts-check
const Router = require("koa-router")
const Path = require("path")
const fs = require("fs")
module.exports = (route) => {
    // let router = new Router()
    route.get('/uploads/:id', (context, next) => {
        let path = `./uploads/${context.params.id}`
        path = Path.resolve(__dirname, path)
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                context.set('Access-Control-Allow-Origin', "*")
                if (Path.extname(path) === 'm3u8') {
                    context.set('Content-Type', 'application/x-mpegURL')
                } else {
                    context.set('Content-Type', 'video/MP2T')
                }
                context.status = 200
                context.body = data
                resolve()
            })
        })
        // return next()
        // fs.createReadStream(path).pipe(context.res)
    })
}