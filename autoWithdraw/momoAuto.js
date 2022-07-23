
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Withdraw = require("../modules/Withdraw")
const Setting = require("../modules/Setting")
const path = require('path')
const BotTelegram = require("../telegram/bot")
const request = require("request")

dotenv.config({ path: path.resolve(__dirname, '../.env') })
mongoose.connect(process.env.DB_CONNECT, () => console.log('Connected to db'));
momoStart = async () => {
    const setting = await Setting.findOne({})
    setTimeout(() => {
        momoStart()
    }, 20000);
    if(setting.autoWithdraw.Momo.isRunning)
    {
        var rutien = await Withdraw.findOne({ status: -1, "bank.gate": 2 })
        console.log(rutien)
        if (rutien) {
            request.get(setting.autoWithdraw.Momo.urlApi + "&amount=" + rutien.amount + "&phoneTarget=" + rutien.bank.stk + "&comment=Doitien", async function (error, response, body) {
                if (!error) {
                    if (body == "thanhcong") {
                        await Withdraw.findOneAndUpdate({ _id: rutien._id }, { status: 1 })
                        BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Auto momo success "+rutien.bank.stk+" "+rutien.amount);
                    }
                    else {
                        BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Chuyen tien MOMO loi "+rutien.bank.stk+" "+rutien.amount);
                    }
                }
            })
        }
    }
}
momoStart()