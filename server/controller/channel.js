// @ts-check
const socket = require("../socket")
const Base = require("./base")
const channel = require("../model/channel.js")
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
                data: channel.get()
            })
        })
    }

    /**
     * 添加直播频道
     * + method POST
     * + URL /channel/
     * 需要传入owner，这样可以通过owner来确定是否是直播发起者
     */
    add() {
        this.routes.post("/", (context, next) => {
            let item = JSON.parse(context.request.body)
            channel.add(item)
            this.renderJSON(context, {
                status: 0
            })
        })
    }

    /**
     * 获取某一频道信息
     * + method GET
     * + URL /channel/:id
     */
    get() {
        this.routes.get("/:id", (context, next) => {
            let c = channel.getOne(context.params.id)
            if (c) {
                this.renderJSON(context, {
                    status: 0,
                    data: c
                })
            } else {
                this.renderJSON(context, {
                    status: -1,
                    message: `the channel with ${context.params.id} not found`
                })
            }
        })
    }

    /**
     * 开始直播
     * + method GET
     * + URL /channel/:id/begin
     */
    begin() {
        this.routes.get('/:id/begin', (context, next) => {
            let id = context.params.id
            socket.create(id)
            this.renderJSON(context, {
                status: 0
            })
        })
    }

    /**
     * 停止直播
     * + method DELETE
     * + URL /channel/:id
     */
    end() {
        this.routes.del('/:id', (context, next) => {
            channel.done()
            this.renderJSON(context, {
                status: 0
            })
        })
    }

    /**
     * 直播播放地址，此地址内部解析
     */
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