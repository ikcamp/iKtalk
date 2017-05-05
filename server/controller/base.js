// @ts-check
const Router = require("koa-router")
class Controller{
    constructor(){
        this.routes = new Router()
    }
    renderJSON(context, data){
        context.set('Content-Type', 'application/josn')
        context.body = data
    }
    route(router, path){
        router.use(path, this.routes.routes())
    }
}

module.exports = Controller