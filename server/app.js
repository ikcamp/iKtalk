// @ts-check

const Koa = require("koa")
const ss = require("socket.io-stream")
const app = new Koa()
const fs = require("fs")
const path = require("path")
const http = require("http")
const uuid = require("node-uuid")
// const bodyParser = require("koa-bodyparser")
const koaStatic = require("koa-static")

const route = require("./routes")
const socket = require("./socket")


app.use(koaStatic(path.resolve(__dirname, "./demo/"), {
    index: 'index.html'
}))
// app.use(bodyParser())
app.use(route.routes())
app.use(route.allowedMethods())


let callback = app.callback()
const server = http.createServer(callback)
const { PORT = 4412 } = process.env

socket.initIO(server)
socket.create('test')

// socket.initIO(server)
server.listen(PORT)

console.log(`app start at ${PORT}`)

