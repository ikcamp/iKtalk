const Koa = require("koa")

const ss = require("socket.io-stream")
const app = new Koa()
const fs = require("fs")
const path = require("path")
const uploadReg = /^\/uploads\//
const http = require("http")
const uuid = require("node-uuid")

app.use((context, next) => {
    if (uploadReg.test(context.url)) {
        context.set("Content-Type", 'video/webm')
        fs.createReadStream(path.resolve(__dirname, `.${context.url}`))
            .pipe(context.body)
    }
})

let callback = app.callback()
const server = http.createServer(callback)
const {PORT = 4412} = process.env
const io = require("socket.io")(server)
server.listen(PORT)



io.on("connection", (socket) => {
    socket.medias = []
    ss(socket).on("media", (stream) => {
        let id = uuid.v4()
        stream.pipe(fs.createWriteStream(path.resolve(__dirname, `./uploads/${id}.webm`)))
        socket.medias.push({
            media: `/uploads/${id}.webm`,
            time: new Date()
        })
    })
})


