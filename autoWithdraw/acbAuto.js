
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Withdraw = require("../modules/Withdraw")
const Setting = require("../modules/Setting")
const path = require('path')
const BotTelegram = require("../telegram/bot")
const request = require("request")
dotenv.config({ path: path.resolve(__dirname, '../.env') })
mongoose.connect(process.env.DB_CONNECT, () => console.log('Connected to db'));


Withdraw.updateMany({ status: 999, "bank.gate": 3 }, { status: -1 }, (data) => {
    console.log(data)
})

start = async () => {
    setTimeout(async () => {
        start()
    }, 20000);
    const setting = await Setting.findOne()
    if (setting.autoWithdraw.Acb.isRunning) {
        let rutTiens = await Withdraw.findOne({ status: -1, "bank.gate": 3 })
        if (rutTiens) {
            rutTiens.status = 999
            rutTiens.save()
            let typebank = rutTiens.bank.bankinfo
            let bankcode = null
            if (typebank == "BIDV") {
                bankcode = 970418
            }
            else if (typebank == "MB Bank") {
                bankcode = 970422
            }
            else if (typebank == "Agribank") {
                bankcode = 970405
            }
            else if (typebank == "ACB Bank") {
                bankcode = 970416
            }
            else if (typebank == "Sacombank") {
                bankcode = 970403
            }
            else if (typebank == "Vietcombank") {
                bankcode = 970436
            }
            else if (typebank == "Techcombank") {
                bankcode = 970407
            }
            else if (typebank == "DONG A Bank") {
                bankcode = 970406
            }
            else if (typebank == "VIETINBANK") {
                bankcode = 970415
            }
            else if (typebank == "VPBank") {
                bankcode = 970432
            }
            else if (typebank == "TPBank") {
                bankcode = 970423
            }
            else if (typebank == "EximBank") {
                bankcode = 970431
            }
            else if (typebank == "SeABank") {
                bankcode = 970440
            }
            else if (typebank == "HDBank") {
                bankcode = 970437
            }
            else if (typebank == "VIB Bank") {
                bankcode = 970441
            }
            else if (typebank == "OCEAN BANK") {
                bankcode = 970414
            }
            else if (typebank == "SHB Bank") {
                bankcode = 970443
            }
            else if (typebank == "BAC A Bank") {
                bankcode = 970409
            }
            else if (typebank == "BaoViet Bank") {
                bankcode = 970438
            }
            else if (typebank == "MaritimeBank") {
                bankcode = 970426
            }
            else if (typebank == "PG Bank") {
                bankcode = 970430
            }
            else if (typebank == "SAIGON Bank") {
                bankcode = 970400
            }
            else if (typebank == "PhuongDong OCB") {
                bankcode = 970448
            }
            else if (typebank == "LienVietBank") {
                bankcode = 970449
            }
            else if (typebank == "PVcomBank") {
                bankcode = 970412
            }
            else if (typebank == "NAMABANK") {
                bankcode = 970428
            }
            else if (typebank == "SCB") {
                bankcode = 970429
            }
            else if (typebank == "KIENLONGBANK") {
                bankcode = 963399
            }
            const ck = await ckAcb(
                setting.autoWithdraw.Acb.linkapi,
                setting.autoWithdraw.Acb.username,
                setting.autoWithdraw.Acb.password,
                setting.autoWithdraw.Acb.accountNumber,
                rutTiens.bank.stk,
                bankcode,
                rutTiens.amount,
                "doitien.me",
                'OTPS'
            )
            if (!ck.error) {
                rutTiens.status = 1
                rutTiens.save()
                let namebankz = ck.data.receiverName
                let bankname = ck.data.bankName
                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Chuyển tiền Bank thành công\nUsername: " + rutTiens.username + "\nTk: " + rutTiens.bank.stk + " Số tiền: " + rutTiens.amount + "\nName: " + namebankz + "\nBank:" + bankname);
            }
            else {
                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Chuyển tiền Bank thất bại \nTk: " + rutTiens.bank.stk + "\n" + ck.message);
                rutTiens.status = -1
                rutTiens.save()
            }
        }
    }
}
start()


const urlGetCode = "https://acb.doitien.me/getOTP"
let ckAcb = (urlapi, username, password, accountNumber, tranfer_to, napasBankCode, amount, message, otp_type = 'OTPS') => {
    return new Promise(async (resolve) => {
        const options = {
            url: urlapi + "api/acb/" + (napasBankCode == 970416 ? "tranfer_local" : "tranfer_247"),
            json: true,
            body: {
                accountNumber: accountNumber,
                username: username,
                password: password,
                tranfer_to: tranfer_to,
                napasBankCode: napasBankCode.toString(),
                amount: amount,
                message: message,
                otp_type: otp_type
            }
        };
        request.post(options, (error, res, body) => {
            if (error) {
                return resolve({ error: true, message: "Lỗi tại api/acb/tranfer_247 " + error.message })
            }
            else if (res.statusCode != 200) {
                return resolve({ error: true, message: "Lỗi tại api/acb/tranfer_247 status != 200" })
            }
            else {
                var jsonRes = body
                if (jsonRes.success == true) {
                    var uuid = jsonRes.data.uuid
                    request.get(urlGetCode, async function (error, response, body) {
                        if (error) {
                            return resolve({ error: true, message: "Lỗi tại get code " + error.message })
                        }
                        else if (response.statusCode != 200) {
                            return resolve({ error: true, message: "Lỗi tại get code status != 200" })
                        }
                        else {
                            var code = body
                            const options = {
                                url: urlapi + "api/acb/confirm_tranfer",
                                json: true,
                                body: {
                                    accountNumber: accountNumber,
                                    username: username,
                                    password: password,
                                    uuid: uuid,
                                    code: code,
                                    otp_type: otp_type
                                }
                            };
                            request.post(options, (error, res, body) => {
                                if (error) {
                                    return resolve({ error: true, message: "Lỗi tại confirm_tranfer " + error.message })
                                }
                                else if (res.statusCode != 200) {
                                    return resolve({ error: true, message: "Lỗi tại get confirm_tranfer status != 200" })
                                }
                                else {
                                    var resJsson = body
                                    if (resJsson.success == true) {
                                        return resolve({ error: false, message: "Ck thành công", data: resJsson })
                                    }
                                    else {
                                        return resolve({ error: true, message: "Lỗi tại not success confirm_tranfer " + JSON.stringify(resJsson) })
                                    }
                                }
                            })
                        }
                    })
                }
                else {
                    return resolve({ error: true, message: "Lỗi tại not success " + JSON.stringify(jsonRes) })
                }
            }
        })
    })
}

