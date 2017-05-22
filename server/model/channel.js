// @ts-check
const uuid = require("node-uuid")
const channels = []
const MAX_VIDEO_FILES = 2
const path = require("path")
const fs = require("fs")
const debug = require("debug")("channel")
const m3u8 = require("m3u")

const C = {
    get() {
        return channels.filter((item) => {
            return !item.done
        })
    },
    getAll() {
        return channels
    },
    add(item) {
        let id = item.id || uuid.v4()
        item.id = id
        item.playUrl = `/channel/${id}/playlist`
        item.done = false
        item.ready = false
        item.videos = []
        channels.push(item)
    },
    done(id) {
        let item = C.getOne(id)
        if (item) {
            item.done = true
        }
    },
    ready(id) {
        let item = C.getOne(id)
        if (item) {
            item.ready = true
        }
    },
    getOne(id) {
        return channels.find((item) => {
            return item.id === id
        })
    },
    addVideo(id, video) {
        let item = C.getOne(id)
        if (item && item.videos) {
            let videos = item.videos
            if (videos.length >= MAX_VIDEO_FILES) {
                let file = path.resolve(__dirname, `..${videos[0].video}`)
                fs.unlink(file, (err, data) => {
                    if (err) {
                        debug(err)
                    } else {
                        debug(`remove file ${file}`)
                    }
                })
                videos.splice(0, 1)

            }
            videos.push(video)
        }
    },
    getM3U(id) {
        let item = C.getOne(id)
        let videos = item.videos
        let writer = m3u8.httpLiveStreamingWriter();
        writer.version(3);
        writer.targetDuration(4);
        writer.allowCache(false);

        if (videos.length) {
            writer.mediaSequence(videos[0].sequence)
        }
        writer.write();
        videos.forEach((item) => {
            writer.file(`${item.video}`, item.duration, `${this.id}-${item.sequence}`)
        })

        let str = writer.toString()
        debug(`playlist: ${str}`);
        return str
    }
}

module.exports = C