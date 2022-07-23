
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Withdraw = require("../modules/Withdraw")
const Setting = require("../modules/Setting")
const path = require('path')
const BotTelegram = require("../telegram/bot")
const request = require("request")
const cheerio = require('cheerio');
var key2captcha = "674b7bd9d310b5b6890aad46e1acfc64"

dotenv.config({ path: path.resolve(__dirname, '../.env') })
mongoose.connect(process.env.DB_CONNECT, () => console.log('Connected to db'));

Withdraw.updateMany({ status: 999, "bank.gate": 1 }, { status: -1 }, (data) => {
    console.log(data)
})

start = async () => {
    setTimeout(async () => {
        var Settingz = await Setting.findOne()
        if(Settingz.autoWithdraw.Tsr.isRunning)
        {
            start()
        }
    }, 5000);

    var rutTiens = await Withdraw.find({ status: -1,  "bank.gate": 1}).limit(2)
    rutTiens.forEach(async (item) => {
        console.log("\x1b[33m", "Bắt đầu ck " + item.bank.stk)
        item.status = 999
        item.save()
        var chuyentien = await CkTsr(item.bank.stk, item.amount, "DoiTien.Me")
        if (!chuyentien.error) {
            item.status = 1
            item.save()
            BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Chuyển tiền Thesieure thành công\nTime: " + chuyentien.time + "s" + "\nTk: " + item.bank.stk + " Số tiền: " + item.amount);
        }
        else {
            BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Chuyển tiền tsr thất bại \nTk: "+item.bank.stk+"\n" + chuyentien.message);
            item.status = -1
            item.save()
        }
    })
}
start()


function CkTsr(taikhoan, sotien, noidung) {
    return new Promise(async (resolve) => {
        var timeStart = new Date().getTime()
        try {
            request.get({ jar: true, url: 'https://thesieure.com/account/login' }, async function (error, response, body) {
                var Settingz = await Setting.findOne()
                if (error) { return resolve({ error: true, message: "Lỗi lấy token login" }) }
                if (response.statusCode != 200) {
                    return resolve({ error: true, message: "Lỗi lấy token login status != 200" })
                }
                else if (response.statusCode == 200) {
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
                            phoneOrEmail: Settingz.autoWithdraw.Tsr.username,
                            password: Settingz.autoWithdraw.Tsr.password
                        }
                    };
                    request.post(options, (error, res, body) => {
                        if (error) { return resolve({ error: true, message: "Lỗi post login " + error.message }) }
                        if (res.statusCode != 302) {
                            return resolve({ error: true, message: "Lỗi post login status != 302" })
                        }
                        else if (res.statusCode == 302) {
                            request({
                                url: "https://thesieure.com/wallet/transfer",
                                method: "GET",
                                jar: cj,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
                                }
                            }, async function (error, response, body) {
                                if (error) {
                                    return resolve({ error: true, message: "Lỗi get transfer error " + error.message })
                                }
                                else if (response.statusCode != 200) {
                                    return resolve({ error: true, message: "Lỗi get transfer status != 200" })
                                }
                                else if (response.statusCode == 200) {
                                    const $ = cheerio.load(body);
                                    var token = $('[name=_token]').val()
                                    request({
                                        url: "https://thesieure.com/transfer/ajax/get-user-name",
                                        method: "POST",
                                        jar: cj,
                                        headers: {
                                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
                                        },
                                        json: true,
                                        body: { "_token": token, "payee_info": taikhoan }
                                    }, async function (errorGetTk, responseGetTk, bodyGetTk) {
                                        if (errorGetTk) {
                                            return resolve({ error: true, message: "Lỗi get username error " + error.message })
                                        }
                                        else if (responseGetTk.statusCode != 200) {
                                            return resolve({ error: true, message: "Lỗi get username status != 200" })
                                        }
                                        else if (bodyGetTk == "" || bodyGetTk == null || bodyGetTk == undefined) {
                                            return resolve({ error: true, message: "Không tìm thấy username", status: 5 })
                                        }
                                        else if (responseGetTk.statusCode == 200) {
                                            var payer_wallet
                                            try {
                                                payer_wallet = body.split('option value="')[1].split('"')[0]
                                            } catch (error) {
                                                return resolve({ error: true, message: "Lỗi get payer_wallet" })
                                            }
                                            if (payer_wallet == undefined) {
                                                return resolve({ error: true, message: "Lỗi get payer_wallet" })
                                            }
                                            request({
                                                url: "https://thesieure.com/wallet/transfer/verify",
                                                method: "POST",
                                                jar: cj,
                                                headers: {
                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
                                                },
                                                json: true,
                                                body: { "payer_wallet": payer_wallet, "payee_info": taikhoan, "payee_name": "qqqq", "amount": sotien, "description": noidung, "_token": token }
                                            }, async function (error, response, body) {
                                                if (error) {
                                                    return resolve({ error: true, message: "Lỗi transfer/verify error " + error.message })
                                                }
                                                else if (response.statusCode != 200) {
                                                    return resolve({ error: true, message: "Lỗi transfer/verify status != 200" })
                                                }
                                                else {
                                                    const $ = cheerio.load(body);
                                                    var _token = $('[name=_token]').val()
                                                    var data_encode = $('[name=data_encode]').val()
                                                    var g_recaptcha
                                                    try {
                                                        g_recaptcha = body.split('data-sitekey="')[1].split('"')[0]
                                                    }
                                                    catch
                                                    {
                                                        return resolve({ error: true, message: "Lỗi lấy g_recaptcha" })
                                                    }
                                                    if (body.includes("error")) {
                                                        return resolve({ error: true, message: "Lỗi bode error" })
                                                    }
                                                    request({
                                                        url: "https://2captcha.com/in.php?key=" + key2captcha + "&method=userrecaptcha&googlekey=" + g_recaptcha + "&pageurl=https://thesieure.com/wallet/transfer/verify",
                                                        method: "GET"
                                                    }, async function (error, response, body) {
                                                        if (response.statusCode != 200) {
                                                            return resolve({ error: true, message: "Lỗi get captcha status != 200" })
                                                        }
                                                        else {
                                                            var idget = body.split('|')[1]
                                                            var solangiai = 0
                                                            var lapgiaicaptcha = setInterval(async () => {
                                                                request({
                                                                    url: "https://2captcha.com/res.php?key=" + key2captcha + "&action=get&id=" + idget,
                                                                    method: "GET"
                                                                }, async function (error, response, body) {
                                                                    if (response.statusCode == 200) {
                                                                        if (!body.includes("CAPCHA_NOT_READY") && !body.includes("OK")) {
                                                                            clearInterval(lapgiaicaptcha)
                                                                            return resolve({ error: true, message: "Lỗi giải captcha thất bại" })
                                                                        }
                                                                        else if (body.includes("OK")) {
                                                                            clearInterval(lapgiaicaptcha)
                                                                            var responsecaptcha = body.split("|")[1]
                                                                            request({
                                                                                url: "https://thesieure.com/wallet/transfer/confirm",
                                                                                method: "POST",
                                                                                jar: cj,
                                                                                headers: {
                                                                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
                                                                                },
                                                                                json: true,
                                                                                body: { "g-recaptcha-response": responsecaptcha, secret: Settingz.sendmoney.acctsr.otp, "data_encode": data_encode, "action": "doPayment", "_token": _token }
                                                                            }, async function (error, response, body) {
                                                                                if (error) {
                                                                                    return resolve({ error: true, message: "Lỗi tại transfer/confirm " + error.message })
                                                                                }
                                                                                else if (response.statusCode == 302) {
                                                                                    if (body.includes("Redirecting")) {
                                                                                        return resolve({ error: false, message: "Chuyển tiền thành công", time: new Date().getTime() - timeStart })
                                                                                    }
                                                                                    else {
                                                                                        return resolve({ error: true, message: "Thất bại k biet tai sao " + body })
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    return resolve({ error: true, message: "Lỗi gì k biết tại transfer/confirm" })
                                                                                }
                                                                            })
                                                                        }
                                                                    }
                                                                    else {
                                                                        console.log("Lỗi check captcha")
                                                                    }
                                                                })
                                                                solangiai++
                                                                if (solangiai > 25) {
                                                                    clearInterval(lapgiaicaptcha)
                                                                    return resolve({ error: true, message: "Lỗi giải captcha quá thời gian" })
                                                                }
                                                            }, 5000)
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            });
                        }
                    })
                }
            })
        } catch (ex) { console.log(ex); return resolve({ error: true, message: "Lỗi không xác định " + error.message }) }
    })
}