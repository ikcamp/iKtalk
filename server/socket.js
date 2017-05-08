// @ts-check
const io = require("socket.io")
const ioStream = require("socket.io-stream")
const fs = require("fs")
const path = require("path")
const uuid = require("node-uuid")
const m3u8 = require("m3u")
// const redis = require('socket.io-redis');
const debug = require("debug")('socket')
const ffmpeg = require("fluent-ffmpeg")


let server
let instance

const sockets = {}
const MAX_VIDEO_FILES = 2

class Socket {
    constructor(id) {
        this.id = id
        console.log(id)
        this.ns = instance.of(`/${id}`)
        this.init()
        this.videos = []
        sockets[id] = this
        this.sequence = 0
        this.duration = 0
    }
    init() {
        this.ns.on("connection", (socket) => {
            socket.on("login", (data) => {
                console.log(data)
                socket.user = data
            })
            ioStream(socket).on("upload", (stream) => {
                let filename = `${this.id}-${this.sequence}.ts`
                let filePath = path.resolve(__dirname, `./uploads/${filename}`)
                let tmpPath = `${filePath}_tmp`
                ffmpeg(stream).videoCodec('libx264').audioCodec('aac').addOption('-mpegts_copyts', 1).addOption('-strict', -2).format('mpegts').addOutputOption('-output_ts_offset', this.duration)
                    .on('error', (err) => {
                        debug('an error happened: ' + err.message);
                    }).save(filePath).on('end', () => {
                        debug('saved')
                        ffmpeg.ffprobe(filePath, (err, data) => {
                            if(err){

                            }
                            this.duration += data.format.duration
                            this.addVideo(`/uploads/${filename}`, data.format.duration)
                        })
                    })
                this.sequence++
            })
        })
    }
    addVideo(video, duration) {
        if (this.videos.length >= MAX_VIDEO_FILES) {
            let file = path.resolve(__dirname, `.${this.videos[0].video}`)
            fs.unlink(file, (err, data)=>{
                if(err){
                    debug(err)
                }else{
                    debug(`remove file ${file}`)
                }
            })
            this.videos.splice(0, 1)
            
        }
        this.videos.push({
            sequence: this.sequence,
            video,
            duration
        })
    }

    getVideoInfo(video) {
        if (video.duration) {
            return Promise.resolve(video.duration)
        } else {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(video.video, (err, data) => {
                    console.log(data)
                })
            })
        }
    }

    getM3U() {
        let writer = m3u8.httpLiveStreamingWriter();
        writer.version(3);
        writer.targetDuration(6);
        writer.allowCache(false);

        if (this.videos.length) {
            writer.mediaSequence(this.videos[0].sequence)
        }
        writer.write();
        this.videos.forEach((item) => {
            writer.file(`${item.video}`, item.duration, `${this.id}-${item.sequence}`)
        })

        let str = writer.toString()
        debug(`playlist: ${str}`);
        return str
    }
    close(sid) {
        let id = this.id
        return new Promise((resolve, reject) => {
            this.io.emit("onStop")
            resolve()
        })
    }
}

const initIO = (server) => {
    server = server
    instance = io(server)
}

const getSocket = (id) => {
    return sockets[id]
}

module.exports = {
    initIO,
    getSocket,
    create(id) {
        new Socket(id)
    }
}