// @ts-check
const io = require("socket.io")
const ioStream = require("socket.io-stream")
const fs = require("fs")
const path = require("path")
const uuid = require("node-uuid")
const m3u8 = require("m3u")
// const redis = require('socket.io-redis');
const debug = require("debug")('socket')

let server
let instance

const sockets = {}
const MAX_VIDEO_FILES = 10

class Socket {
    constructor(id) {
        this.id = id
        let inst = getInstance()
        this.io = inst.of(id)
        this.init()
        this.videos = []
        sockets[id] = this
        this.sequence = 0
    }
    init() {
        this.io.on("connection", (socket) => {
            socket.on("connect", (data) => {
                socket.user = data
            })
            ioStream(socket).on("upload", (stream) => {
                let id = uuid.v4()
                stream.pipe(fs.createWriteStream(path.resolve(__dirname, `./uploads/${id}.ts`)))
                this.addVideo(`/uploads/${id}.ts`)
                this.io.emit("onSourceChange")
            })
        })
    }
    addVideo(video) {
        if (this.videos.length >= MAX_VIDEO_FILES) {
            this.videos.splice(0, 1)
        }
        this.videos.push({
            sequence: this.sequence,
            video
        })
        this.sequence++
    }
    getM3U() {
        let writer = m3u8.httpLiveStreamingWriter();
        // EXT-X-TARGETDURATION: Maximum media file duration.
        writer.targetDuration(10);

        // EXT-X-MEDIA-SEQUENCE: Sequence number of first file (optional).
        // (optional)
        this.videos.forEach((item) => {
            writer.mediaSequence(item.sequence)
            writer.write(item.video)
        })


        // EXT-X-PROGRAM-DATE-TIME: The date of the program's origin, optional.
        // (optional)
        writer.programDateTime(new Date().toUTCString());

        // EXT-X-ALLOW-CACHE: Set if the client is allowed to cache this m3u file.
        // (optional)
        writer.allowCache(true);
        // writer.allowCache(false);

        // // EXT-X-PLAYLIST-TYPE: Provides mutability information about the m3u file.
        // // (optional)
        // writer.playlistType('EVENT');
        // writer.playlistType('VOD');

        // EXT-X-ENDLIST: Indicates that no more media files will be added to the m3u file.
        // (optional)
        writer.endlist();

        // // EXT-X-VERSION: Indicates the compatibility version of the Playlist file.
        // // (optional)
        // writer.version(3);


        // EXT-X-DISCONTINUITY: Indicates that the player should expect the next video segment to be a different resolution or have a different audio profile than the last.
        writer.discontinuity();
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
}

const getInstance = () => {
    // if(!instance){
    instance = io(server)
    // instance.adapter(redis({
    //     host: 'localhost',
    //     port: 6379
    // }))
    // }
    return instance
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

new Socket('test')