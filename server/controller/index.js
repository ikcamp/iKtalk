const user = require("./user")
const channel = require("./channel")
module.exports = (router)=>{
    user(router)
    channel(router)
}