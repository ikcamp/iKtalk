// @ts-check
const uuid = require("node-uuid")
const channels = []

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
        channels.push(item)
    },
    done(id) {
        let item  = C.getOne(id)
        item.done = true
    },
    ready(id){
        let item = C.getOne(id)
        item.ready = true
    },
    getOne(id){
        return channels.find((item)=>{
            return item.id === id
        })
    }
}

module.exports = C