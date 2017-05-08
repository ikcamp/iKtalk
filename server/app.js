// @ts-check

const Koa = require("koa")
const ss = require("socket.io-stream")
const app = new Koa()
const fs = require("fs")
const path = require("path")
const http = require("http")
const https = require("https")
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
const { PORT = 4412, HTTPS_PORT = 4413 } = process.env

let httpsServer = https.createServer({
    key: fs.readFileSync(path.resolve(__dirname, './cert/private.key')),
    cert:fs.readFileSync(path.resolve(__dirname, './cert/pub.crt'))
}, callback)

socket.initIO(server, httpsServer)
socket.create('test')

// socket.initIO(server)
server.listen(PORT)
console.log(`http start at ${PORT}`)

httpsServer.listen(HTTPS_PORT)
console.log(`https start at ${HTTPS_PORT}`)

