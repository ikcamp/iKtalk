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
const C = require('./model/channel')


let server
let instance

const MAX_VIDEO_FILES = 2

class Socket {
    constructor(id) {
        this.id = id
        this.ns = instance.of(`/${id}`)
        this.init()
        this.videos = []
        this.sequence = 0
        this.duration = 0
    }
    init() {
        this.ns.on("connection", (socket) => {
            /**
             * socket 连接后，告知socket当前用户信息
             */
            socket.on("login", (data) => {
                socket.user = data
            })
            /**
             * 上传视频片段
             */
            ioStream(socket).on("upload", (stream) => {
                let filename = `${this.id}-${this.sequence}.ts`
                let filePath = path.resolve(__dirname, `./uploads/${filename}`)
                /**
                 * 采用ffmpeg转webm格式为mpeg-ts片断
                 * 手动设置视频片段的offset
                 */
                ffmpeg(stream).videoCodec('libx264').audioCodec('aac').addOption('-mpegts_copyts', 1).addOption('-strict', -2).format('mpegts').addOutputOption('-output_ts_offset', this.duration)
                    .on('error', (err) => {
                        debug('an error happened: ' + err.message);
                        /**
                         * 保存视频片段到磁盘
                         */
                    }).save(filePath).on('end', () => {
                        debug('saved')
                        /**
                         * 获取媒体信息
                         */
                        ffmpeg.ffprobe(filePath, (err, data) => {
                            if (err) {
                                debug(err)
                            }
                            /**
                             * 为了计算下一片段的起始时间
                             */
                            this.duration += data.format.duration
                            this.addVideo(`/uploads/${filename}`, data.format.duration)
                            this.sequence++
                            if (this.sequence === MAX_VIDEO_FILES) {
                                C.ready(this.id)
                                // 刚开始直播的时候，由于服务器端还为处理完第一片视频，客户端是无法播放的。直邮等待服务器端处理好了视频之后才能播放
                                socket.emit("videoReady")
                            }
                        })
                    })
            })

            const online = () => {
                this.ns.clients((err, cs) => {
                    this.ns.emit("online", cs.length)
                })
            }

            online()

            /**
             * 弹幕，接收客户端的message，然后直接广播出去
             */
            socket.on('new message', (data) => {
                socket.broadcast.emit('new message', {
                    message: data
                })
            })
            /**
             * 当用户断开socket连接的时候，修改直播频道状态
             */
            socket.on('disconnect', () => {
                online()
                let channel = C.getOne(this.id)
                if (!socket.user) {
                    return
                }
                if (!socket.user.id === channel.owner) {
                    return
                }
                C.done(this.id)
                /**
                 * 删除掉磁盘上的文件
                 */
                this.videos.forEach((item) => {
                    let file = path.resolve(__dirname, `.${item.video}`)
                    fs.unlink(file, (err) => {
                        if (err) {
                            debug(`delete file: ${file} error`)
                        }
                    })
                })
            })
        })
    }

    /**
     * 添加视频片段。服务器端只保留最新的`MAX_VIDEO_FILES`个的文件。
     */
    addVideo(video, duration) {
        C.addVideo(this.id, {
            sequence: this.sequence,
            video,
            duration
        })
    }

    /**
     * 构建m3u8文件
     */
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
}

const initIO = (server, httpsServer) => {
    server = server
    instance = io(server)
    if (httpsServer) {
        instance.attach(httpsServer)
    }
}

const create = (id) => {
    let s = new Socket(id)
}

module.exports = {
    initIO,
    create
}
