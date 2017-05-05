// @ts-check
let channels = {

}



module.exports = {
    add(channel){
        channel.videos = []
        channels[channel.id] = channel
    },
    getAll(){
        return Object.keys(channels).filter((key)=>{
            return channels[key].live === true
        }).map((key)=>{
            return channels[key]
        })
    },
    end(id){
        channels[id].live = false
    },
    live(id){
        channels[id].live = true
    },
    getById(id){
        return channels[id]
    },
    setMedia(id, url){
        
    }
}