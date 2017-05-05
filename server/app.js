// @ts-check

const Koa = require("koa")
const ss = require("socket.io-stream")
const app = new Koa()
const fs = require("fs")
const path = require("path")
const uploadReg = /^\/uploads\//
const http = require("http")
const uuid = require("node-uuid")
const route = require("./routes")
const socket = require("./socket")

app.use(route.routes())
app.use(route.allowedMethods())

let callback = app.callback()
const server = http.createServer(callback)
const {PORT = 4412} = process.env
socket.initIO(server)
server.listen(PORT)

console.log(`app start at ${PORT}`)



