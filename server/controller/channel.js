// @ts-check

const Router = require("koa-router")
const uuid = require("node-uuid")
// const channels = []
const socket = require("../socket")
const Base = require("./base")
const C = require("../model/channel.js")
/**
 * 直播频道接口
 */
class Channel extends Base {
    constructor() {
        super()
        this.list()
        this.add()
        this.playList()
        this.get()
    }

    /**
     * 获取直播频道列表
     * + method GET
     * + URL /channel/
     */
    list() {
        this.routes.get("/", (context, next) => {
            this.renderJSON(context, {
                status: 0,
                data: C.get()
            })
        })
    }

    /**
     * 添加直播频道
     * + method POST
     * + URL /channel/
     */
    add() {
        this.routes.post("/", (context, next) => {
            let item = JSON.parse(context.request.body)
            C.add(item)
            this.renderJSON(context, {
                status: 0
            })
        })
    }



    /**
     * 
     */
    get() {
        this.routes.get("/:id", (context, next) => {
            let channel = C.getOne(context.params.id)
            if (channel) {
                this.renderJSON(context, {
                    status: 0,
                    data: channel
                })
            } else {
                this.renderJSON(context, {
                    status: -1,
                    message: `the channel with ${context.params.id} not found`
                })
            }
        })
    }

    begin() {
        this.routes.post('/:id/begin', (context, next) => {
            let id = context.params.id
            socket.create(id)
            this.renderJSON(context, {
                status: 0
            })
        })
    }

    end() {
        this.routes.del('/:id', (context, next) => {
            C.done()
            this.renderJSON(context, {
                status: 0
            })
        })
    }

    playList() {
        this.routes.get('/:id/playlist', (context, next) => {
            let id = context.params.id
            let s = socket.getSocket(id)
            context.set('Access-Control-Allow-Origin', "*")
            context.set('Content-Type', 'application/x-mpegURL')
            context.body = s.getM3U()
        })
    }
}

module.exports = (router) => {
    new Channel().route(router, '/channel')
}