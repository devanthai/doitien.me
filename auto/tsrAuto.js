const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const request = require("request")
const Deposit = require("../modules/Deposit")
const Setting = require("../modules/Setting")
const History = require("../modules/History")
const UserInfo = require("../modules/User/UserInfo")
const path = require('path')
const redisClient = require("../redisCache")
dotenv.config({ path: path.resolve(__dirname, '../.env') })
mongoose.connect(process.env.DB_CONNECT, () => console.log('Connected to db'));

function TheSieuRe() {
    return new Promise(async (resolve) => {
        const setting = await Setting.findOne({})

        try {
            request.get({ jar: true, url: 'https://thesieure.com/account/login' }, function (error, response, body) {
                // if (error) throw error; 
                if (error) { return resolve("loi1") }
                if (response.statusCode == 200) {
                    const $ = cheerio.load(body);
                    var token = $('[name=_token]').val()
                    const cj = request.jar();
                    for (var i = 0; i < response.headers['set-cookie'].length; i++) {
                        cj.setCookie(response.headers['set-cookie'][i], 'https://thesieure.com/');
                    }
                    const options = {
                        url: 'https://thesieure.com/account/login',
                        jar: cj,
                        json: true,
                        body: {
                            _token: token,
                            phoneOrEmail: setting.autoDeposit.Tsr.username,
                            password: setting.autoDeposit.Tsr.password
                        }
                    };
                    request.post(options, (error, res, body) => {
                        //      if (error) throw error; 
                        if (error) { return resolve("loi") }
                        if (res.statusCode == 302) {
                            request.get({ url: 'https://thesieure.com/wallet/transfer', jar: cj }, function (error, response, body) {
                                const $ = cheerio.load(body, {
                                    normalizeWhitespace: true,
                                    xmlMode: true
                                });
                                cheerioTableparser($);
                                var data = $(".col-sm-12.table-responsive").parsetable(true, true, true);
                                try {
                                    var array = []
                                    for (var i = 1; i < data[0].length; i++) {
                                        var magd = data[0][i];
                                        var sotien = data[1][i];
                                        var ten = data[2][i];
                                        var time = data[3][i];
                                        var status = data[4][i];
                                        var noidung = data[5][i];
                                        sotien = Number(sotien.replace(/,/g, '').replace("đ", ''))
                                        if (sotien > 0) {
                                            array.push({ magd: magd, sotien: sotien, ten: ten, time: time, status: 1, noidung: noidung })
                                        }
                                    }
                                    return resolve(array)
                                } catch { return resolve("loi") }
                            });
                        }
                        else
                            return resolve("loi")
                    });
                } else return resolve("loi")
            });
        } catch { return resolve("loi") }

    });

}


setInterval(async () => {
    var getTransactions = await TheSieuRe();
    if (getTransactions != "loi") {
        getTransactions.forEach(async(element) => {
            var description = element.noidung.toLowerCase()
            var creditAmount = element.sotien
            const deposits = await Deposit.find({ $text: { $search: description }, status: 0 })
            var donpick = null
            deposits.forEach(elementz => {
                if (description.search(elementz.content.toLowerCase()) != -1) {
                    donpick = elementz
                }
            });

            if (donpick != null && donpick.gate.toLowerCase().includes("tsr")) {
                if (creditAmount == donpick.amount && description.split("naptien").length == 2) {
                    await Deposit.findByIdAndUpdate(donpick._id, { status: 1 })
                    var userI = await UserInfo.findOneAndUpdate({ uid: donpick.uid }, { $inc: { money: donpick.amount } })
                    const history = await History({ transid: donpick.transid, amount: creditAmount, firtBalance: userI.money, lastBalance: userI.money + creditAmount, content: "Nạp tiền từ TSR", uid: donpick.uid }).save()
                    if (history) {
                        const keyHistory = "history"
                        const keyRedisHistory = keyHistory + donpick.uid
                        const checkHistoryredis = await redisClient.get(keyRedisHistory)
                        var arrayHistory = JSON.parse(checkHistoryredis)
                        if (arrayHistory == null) {
                            arrayHistory = []
                        }
                        arrayHistory.unshift(history)
                        await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                    }
                }
            }
        });
    }
}, 15000)