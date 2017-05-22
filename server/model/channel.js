// @ts-check
const uuid = require("node-uuid")
// const channels = [
//    {
//        id: 1,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '我的直播'
//    },{
//        id: 2,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '四级英语提升'
//    },{
//        id: 3,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '六级英语提升'
//    },{
//        id: 4,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '口语提高班'
//    },{
//        id: 5,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '四级英语提升'
//    },{
//        id: 6,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '六级英语提升'
//    },{
//        id: 7,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '口语提高班'
//    },{
//        id: 8,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '口语提高班'
//    },{
//        id: 9,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '四级英语提升'
//    },{
//        id: 10,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '六级英语提升'
//    },{
//        id: 11,
//        playUrl: '/channel/testuser/playlist',
//        done: false,
//        ready: false,
//        name: '口语提高班'
//    }
//]
//
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
   }
}

module.exports = C