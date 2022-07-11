const User = require("../modules/User/User")
const UserInfo = require("../modules/User/UserInfo")
const Historys = require("../modules/History")

const Helper = require("../Helpers/Helper")
const validator = require('validator');
var jwt = require('jsonwebtoken');
const redisClient = require("../redisCache")
const SECRET = "tyu5t67uyr5TTT65^^^"
const keyTranshis = "transhis"
const keyHistory = "history"


SearchHistoryMiddleware = async (req, res, next) => {
    const submit = req.query.submit
    if (submit == "filter") {
        var { search, fromdate, todate } = req.query
        try {
            var start = new Date(fromdate).setHours(0, 0, 0, 0);
            var end = new Date(todate).setHours(23, 59, 59, 999);
            var temp = { $text: { $search: search }, time: { $gte: start, $lte: end }, uid: req.user._id }
            if (search != "") {
                delete temp["time"]
            }
            else {
                delete temp["$text"]
            }
            const findCards = await Historys.find(temp).sort({ time: -1 })
            var hisdata = { his: findCards, current: 1, pages: 1 }
            res.render("index", { page: "wallet/history", user: req.user, userInfo: req.userInfo, hisdata: hisdata, isSearch: true });
        } catch (ex) { console.log("Loi tai SearchMiddleware: " + ex) }
    }
    else {
        next()
    }
}
GetHistoryData = async (req, res, next) => {
    var perPage = 10
    var page = req.query.page || 1
    const uid = req.userInfo.uid
    const keyredis = keyHistory + uid
    const checkTransRedis = await redisClient.get(keyredis)
    if (!checkTransRedis) {
        const gethisDb = await Historys.find({ uid: uid }).sort({ time: -1 })
        await redisClient.set(keyredis, JSON.stringify(gethisDb))
    }
    var transhis = await redisClient.get(keyredis)
    transhis = JSON.parse(transhis)
    if (transhis == null) {
        transhis = []
    }
    const countHis = transhis.length
    var start = (perPage * page) - perPage
    var end = start + perPage
    var data = transhis
    if (end != 0) {
        data = transhis.slice(start, end);
    }
    var hisdata = { his: data, current: page, pages: Math.ceil(countHis / perPage) }
    req.history = hisdata
    next()
}
HistoryView = (req, res) => {
    res.render("index", { page: "wallet/history", user: req.user, userInfo: req.userInfo, hisdata: req.history })
}

ListView = (req, res) => {
    res.render("index", { page: "wallet/list", user: req.user, userInfo: req.userInfo })
}

module.exports = {  HistoryView, GetHistoryData, SearchHistoryMiddleware, ListView }