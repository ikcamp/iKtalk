// @ts-check
const Router = require("koa-router")
const controller = require("./controller")
// const 
const route = new Router()

controller(route)

module.exports = route