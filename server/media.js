// @ts-check
const Router = require("koa-router")
const Path = require("path")
const fs = require("fs")
module.exports = (route) => {
    let router = new Router()
    router.get('/upload/:id', (context, next)=>{
        let path = `./uploads/${context.params.id}.webm`
        path = Path.resolve(__dirname, path)
        context.set('Content-Type', 'video/webm')
        fs.createReadStream(path)
            .pipe(context.body)
    })
}