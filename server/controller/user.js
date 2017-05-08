// @ts-check
const Router = require("koa-router")
const user = require("../model/user")
const Base = require("./base")

/**
 * 用户管理
 */
class User extends Base {
    constructor() {
        super()
        this.add()
        this.getById()
    }
    /**
     * 添加用户
     * + method POST
     * + URL /user
     */
    add() {
        this.routes.post('/', (context, next) => {
            let item = context.request.form
            let u = user.add(item)
            this.renderJSON(context, {
                status: 0,
                data: u
            })
        })
    }

    /**
     * 获取用户信息
     * + method GET
     * + URL /user/:id
     */
    getById() {
        this.routes.get('/:id', (context, next) => {
            let id = context.params.id
            let u = user.getUser(id)
            this.renderJSON(context, {
                status: 0,
                data: u
            })
        })
    }
}

module.exports = (router) => {
    new User().route(router, '/user')
}