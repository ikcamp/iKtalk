// @ts-check
const users = []
const uuid = require("node-uuid")
module.exports = {
    add(user = {}) {
        user.id = user.id || uuid.v4()
        users.push(user)
        return user
    },
    remove(id) {
        let index = users.findIndex((item) => {
            return item.id === id
        })
        users.splice(index, 1)
    },
    getUser(id) {
        return users[id]
    }
}