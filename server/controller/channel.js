// @ts-check

const Router = require("koa-router")
const uuid = require("node-uuid")
const channels = []
const socket = require("../socket")
const Base = require("./base")

class Channel extends Base {
    constructor(channels) {
        super()
        this.channels = channels
        this.list()
        this.add()
        this.get()
    }

    list() {
        this.routes.get("/", (context, next) => {
            this.renderJSON({
                status: 0,
                data: this.channels
            })
        })
    }
    add() {
        this.routes.post("/", (context, next) => {
            let item = JSON.parse(context.request.body)
            item.id = uuid.v4()
            this.channels.push(item)
            this.renderJSON({
                status: 0
            })
        })
    }

    _get(id) {
        return this.channels.find((item) => {
            return item.id === id
        })
    }

    get() {
        this.routes.get("/:id", (context, next) => {
            let channel = this._get(context.params.id)
            if (channel) {
                this.renderJSON({
                    status: 0,
                    data: channel
                })
            } else {
                this.renderJSON({
                    status: -1,
                    message: `the channel with ${context.params.id} not found`
                })
            }
        })
    }

    begin(){
        this.routes.post('/:id/begin', (context, next)=>{
            let id = context.params.id
            socket.create(id)
            this.renderJSON({
                status: 0
            })
        })
    }

    end() {
        this.routes.del('/:id', (context, next) => {
            let index = this.channels.findIndex((item) => {
                return item.id === context.params.id
            })
            if (index < 0) {
                this.renderJSON({
                    status: -1,
                    message: `the channel with ${context.params.id} not found`
                })
            } else {
                let s = socket.getSocket(context.params.id)
                s.end()
                this.channels.splice(index, 1)
                this.renderJSON({
                    status: 0
                })
            }
        })
    }
}

module.exports = (router) => {
    new Channel(channels).route(router, '/channel')
}