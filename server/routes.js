// @ts-check
const Router = require("koa-router")
const controller = require("./controller")
const media = require('./media')
// const 
const route = new Router()

controller(route)

media(route)
module.exports = route