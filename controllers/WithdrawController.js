
const UserBank = require("../modules/User/UserBank")
const UserInfo = require("../modules/User/UserInfo")
const Withdraw = require("../modules/Withdraw")
const Helper = require("../Helpers/Helper")
const Setting = require("../modules/Setting")
const Historys = require("../modules/History")
const FeeOutMoney = require("../modules/FeeOutMoney")
const redisClient = require("../redisCache")
const BotTelegram = require("../telegram/bot")
const dotenv = require('dotenv');
dotenv.config()
WithDrawHomeView = async (req, res) => {
    var setting = await Setting.findOne({})
    var message = undefined
    const messFlash = req.flash('message')
    if (messFlash.length != 0) {
        if (messFlash[0].error == 1) {
            message = Helper.ErrorMessage(messFlash[0].message)
        }
        else {
            message = Helper.SuccessMessage(messFlash[0].message)
        }
    }
    const userBanks = await UserBank.find({ uid: req.user._id })
    var perPage = 9
    var page = req.query.page || 1
    var data = await Withdraw.find({ uid: req.user._id, "bank.gate": 5 }).skip((perPage * page) - perPage).limit(perPage).sort({ 'time': -1 });
    var count = await Withdraw.countDocuments({ uid: req.user._id, "bank.gate": 5 });
    const fees = await FeeOutMoney.find({ gate: 5 })
    res.render("index", { page: "withdraw/home", user: req.user, userInfo: req.userInfo, message, userBanks, setting, data: data, current: page, pages: Math.ceil(count / perPage), fees })
}

WithDrawHome = async (req, res) => {
    const { amount, stk, namestk, secret } = req.body

    if (req.userInfo.isActivePassLevel2 && !Helper.validPassword(secret, req.user.PasswordLevel2)) {
        req.flash('message', { error: 1, message: "Sai mật khẩu cấp 2." })
        return res.redirect("/withdraw/home")
    }
    else {
        const setting = await Setting.findOne({})

        const feestsr = await FeeOutMoney.find({ gate: 5 })
        if (isNaN(amount)) {
            req.flash('message', { error: 1, message: "Số tiền nhập không hợp lệ." })
            return res.redirect("/withdraw/home")
        }
        else if (amount < setting.withdraw.min || amount > setting.withdraw.max) {
            req.flash('message', { error: 1, message: "Số tiền cho phép từ " + setting.withdraw.min + " đến " + setting.withdraw.max })
            return res.redirect("/withdraw/home")
        }
        else {

            const userInfo = await UserInfo.findOne({ uid: req.session.UserId })
            if (userInfo) {

                var moneyFee = 0
                for (let i = 0; i < feestsr.length; i++) {
                    if (feestsr[i].from <= amount && amount <= feestsr[i].to) {
                        if (feestsr[i].isfeeVnd) {
                            moneyFee = amount - feestsr[i].feeVnd
                        }
                        else {
                            moneyFee = amount - (amount * (feestsr[i].percent / 100))
                        }
                        break
                    }
                }
                if (moneyFee == 0) {
                    moneyFee = amount
                }
                if (userInfo.money < moneyFee) {
                    req.flash('message', { error: 1, message: "Không có đủ tiền để rút, bạn còn thiếu " + Helper.numberWithCommas(Math.round(userInfo.money - moneyFee)*-1) + " vnđ đã gồm phí" })
                    return res.redirect("/withdraw/home")
                }
                else {
                    try {
                        const setAmount = await WidthDrawSetAmount(userInfo.uid, -moneyFee)
                        if (setAmount.error == 0) {

                            req.userInfo.money = setAmount.userinfo.money

                            var bankInfo = {
                                name: namestk,
                                stk: stk,
                                bankinfo: "Tận nhà",
                                gate: 5
                            }

                            const newWithDraw = await Withdraw({ transid: Helper.getTranidWithdraw(), amount: amount, bank: bankInfo, uid: req.user._id, username: req.user.Username, moneyfirst: req.userInfo.money }).save()
                            const history = await Historys({ transid: newWithDraw.transid, amount: -moneyFee, firtBalance: userInfo.money, lastBalance: setAmount.userinfo.money, content: "Rút tiền về " + bankInfo.bankinfo, uid: req.userInfo.uid }).save()

                            try {
                                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Rút tiền: " + newWithDraw.transid + "\nSố tiền: " + Helper.numberWithCommas(amount) + "\nRút về: " + bankInfo.bankinfo)

                            } catch { }


                            if (history) //Them vao redis cache
                            {
                                const keyHistory = "history"
                                const keyRedisHistory = keyHistory + req.userInfo.uid
                                const checkHistoryredis = await redisClient.get(keyRedisHistory)
                                var arrayHistory = JSON.parse(checkHistoryredis)
                                if (arrayHistory == null) {
                                    arrayHistory = []
                                }
                                arrayHistory.unshift(history)
                                await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                            }
                            req.flash('message', { error: 0, message: "Tạo đơn rút thành công vui lòng chờ duyệt" })
                            return res.redirect("/withdraw/home")
                        }
                    } catch (error) {
                        req.flash('message', { error: 1, message: error.message })
                        return res.redirect("/withdraw/home")
                    }
                }
            }
            else {
                return res.redirect("/withdraw/home")
            }
        }
    }
}


WithDrawGt1sView = async (req, res) => {
    var setting = await Setting.findOne({})
    var message = undefined
    const messFlash = req.flash('message')
    if (messFlash.length != 0) {
        if (messFlash[0].error == 1) {
            message = Helper.ErrorMessage(messFlash[0].message)
        }
        else {
            message = Helper.SuccessMessage(messFlash[0].message)
        }
    }
    const userBanks = await UserBank.find({ uid: req.user._id })
    var perPage = 9
    var page = req.query.page || 1
    var data = await Withdraw.find({ uid: req.user._id, "bank.gate": 4 }).skip((perPage * page) - perPage).limit(perPage).sort({ 'time': -1 });
    var count = await Withdraw.countDocuments({ uid: req.user._id, "bank.gate": 4 });
    const fees = await FeeOutMoney.find({ gate: 4 })
    res.render("index", { page: "withdraw/gt1s", user: req.user, userInfo: req.userInfo, message, userBanks, setting, data: data, current: page, pages: Math.ceil(count / perPage), fees })
}

WithDrawGt1s = async (req, res) => {
    const { amount, stk, namestk, secret } = req.body

    if (req.userInfo.isActivePassLevel2 && !Helper.validPassword(secret, req.user.PasswordLevel2)) {
        req.flash('message', { error: 1, message: "Sai mật khẩu cấp 2." })
        return res.redirect("/withdraw/bank")
    }
    else {
        const setting = await Setting.findOne({})

        const feestsr = await FeeOutMoney.find({ gate: 4 })
        if (isNaN(amount)) {
            req.flash('message', { error: 1, message: "Số tiền nhập không hợp lệ." })
            return res.redirect("/withdraw/gt1s")
        }
        else if (amount < setting.withdraw.min || amount > setting.withdraw.max) {
            req.flash('message', { error: 1, message: "Số tiền cho phép từ " + setting.withdraw.min + " đến " + setting.withdraw.max })
            return res.redirect("/withdraw/gt1s")
        }
        else {

            const userInfo = await UserInfo.findOne({ uid: req.session.UserId })
            if (userInfo) {

                var moneyFee = 0
                for (let i = 0; i < feestsr.length; i++) {
                    if (feestsr[i].from <= amount && amount <= feestsr[i].to) {
                        if (feestsr[i].isfeeVnd) {
                            moneyFee = amount - feestsr[i].feeVnd
                        }
                        else {
                            moneyFee = amount - (amount * (feestsr[i].percent / 100))
                        }
                        break
                    }
                }
                if (moneyFee == 0) {
                    moneyFee = amount
                }
                if (userInfo.money < moneyFee) {
                    req.flash('message', { error: 1, message: "Không có đủ tiền để rút, bạn còn thiếu " + Helper.numberWithCommas(Math.round(userInfo.money - moneyFee)*-1) + " vnđ đã gồm phí" })
                    return res.redirect("/withdraw/gt1s")
                }
                else {
                    try {
                        const setAmount = await WidthDrawSetAmount(userInfo.uid, -moneyFee)
                        if (setAmount.error == 0) {

                            req.userInfo.money = setAmount.userinfo.money

                            var bankInfo = {
                                name: namestk,
                                stk: stk,
                                bankinfo: "Gachthe1s.Com",
                                gate: 4
                            }

                            const newWithDraw = await Withdraw({ transid: Helper.getTranidWithdraw(), amount: amount, bank: bankInfo, uid: req.user._id, username: req.user.Username, moneyfirst: req.userInfo.money }).save()
                            const history = await Historys({ transid: newWithDraw.transid, amount: -moneyFee, firtBalance: userInfo.money, lastBalance: setAmount.userinfo.money, content: "Rút tiền về " + bankInfo.bankinfo, uid: req.userInfo.uid }).save()

                            try {
                                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Rút tiền: " + newWithDraw.transid + "\nSố tiền: " + Helper.numberWithCommas(amount) + "\nRút về: " + bankInfo.bankinfo)

                            } catch { }


                            if (history) //Them vao redis cache
                            {
                                const keyHistory = "history"
                                const keyRedisHistory = keyHistory + req.userInfo.uid
                                const checkHistoryredis = await redisClient.get(keyRedisHistory)
                                var arrayHistory = JSON.parse(checkHistoryredis)
                                if (arrayHistory == null) {
                                    arrayHistory = []
                                }
                                arrayHistory.unshift(history)
                                await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                            }
                            req.flash('message', { error: 0, message: "Tạo đơn rút thành công vui lòng chờ duyệt" })
                            return res.redirect("/withdraw/gt1s")
                        }
                    } catch (error) {
                        req.flash('message', { error: 1, message: error.message })
                        return res.redirect("/withdraw/gt1s")
                    }
                }
            }
            else {
                return res.redirect("/withdraw/gt1s")
            }
        }
    }
}

WithDrawBankView = async (req, res) => {
    var setting = await Setting.findOne({})
    var message = undefined
    const messFlash = req.flash('message')
    if (messFlash.length != 0) {
        if (messFlash[0].error == 1) {
            message = Helper.ErrorMessage(messFlash[0].message)
        }
        else {
            message = Helper.SuccessMessage(messFlash[0].message)
        }
    }
    const userBanks = await UserBank.find({ uid: req.user._id })
    var perPage = 9
    var page = req.query.page || 1
    var data = await Withdraw.find({ uid: req.user._id, "bank.gate": 3 }).skip((perPage * page) - perPage).limit(perPage).sort({ 'time': -1 });
    var count = await Withdraw.countDocuments({ uid: req.user._id, "bank.gate": 3 });
    const fees = await FeeOutMoney.find({ gate: 3 })
    res.render("index", { page: "withdraw/bank", user: req.user, userInfo: req.userInfo, message, userBanks, setting, data: data, current: page, pages: Math.ceil(count / perPage), fees })
}

WithDrawBank = async (req, res) => {
    const { amount, stk, namestk, secret,bankinfo_id } = req.body

    if (req.userInfo.isActivePassLevel2 && !Helper.validPassword(secret, req.user.PasswordLevel2)) {
        req.flash('message', { error: 1, message: "Sai mật khẩu cấp 2." })
        return res.redirect("/withdraw/bank")
    }
    else {
        const setting = await Setting.findOne({})

        const feestsr = await FeeOutMoney.find({ gate: 3 })
        if (isNaN(amount)) {
            req.flash('message', { error: 1, message: "Số tiền nhập không hợp lệ." })
            return res.redirect("/withdraw/bank")
        }
        else if (amount < setting.withdraw.min || amount > setting.withdraw.max) {
            req.flash('message', { error: 1, message: "Số tiền cho phép từ " + setting.withdraw.min + " đến " + setting.withdraw.max })
            return res.redirect("/withdraw/bank")
        }
        else {

            const userInfo = await UserInfo.findOne({ uid: req.session.UserId })
            if (userInfo) {

                var moneyFee = 0
                for (let i = 0; i < feestsr.length; i++) {
                    if (feestsr[i].from <= amount && amount <= feestsr[i].to) {
                        if (feestsr[i].isfeeVnd) {
                            moneyFee = amount - feestsr[i].feeVnd
                        }
                        else {
                            moneyFee = amount - (amount * (feestsr[i].percent / 100))
                        }
                        break
                    }
                }
                if (moneyFee == 0) {
                    moneyFee = amount
                }
                if (userInfo.money < moneyFee) {
                    req.flash('message', { error: 1, message: "Không có đủ tiền để rút, bạn còn thiếu " + Helper.numberWithCommas(Math.round(userInfo.money - moneyFee)*-1) + " vnđ đã gồm phí" })
                    return res.redirect("/withdraw/bank")
                }
                else {
                    try {
                        const setAmount = await WidthDrawSetAmount(userInfo.uid, -moneyFee)
                        if (setAmount.error == 0) {

                            req.userInfo.money = setAmount.userinfo.money

                            var bankInfo = {
                                name: namestk,
                                stk: stk,
                                bankinfo: bankinfo_id,
                                gate: 3
                            }

                            const newWithDraw = await Withdraw({ transid: Helper.getTranidWithdraw(), amount: amount, bank: bankInfo, uid: req.user._id, username: req.user.Username, moneyfirst: req.userInfo.money }).save()
                            const history = await Historys({ transid: newWithDraw.transid, amount: -moneyFee, firtBalance: userInfo.money, lastBalance: setAmount.userinfo.money, content: "Rút tiền về " + bankInfo.bankinfo, uid: req.userInfo.uid }).save()

                            try {
                                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Rút tiền: " + newWithDraw.transid + "\nSố tiền: " + Helper.numberWithCommas(amount) + "\nRút về: " + bankInfo.bankinfo)

                            } catch { }


                            if (history) //Them vao redis cache
                            {
                                const keyHistory = "history"
                                const keyRedisHistory = keyHistory + req.userInfo.uid
                                const checkHistoryredis = await redisClient.get(keyRedisHistory)
                                var arrayHistory = JSON.parse(checkHistoryredis)
                                if (arrayHistory == null) {
                                    arrayHistory = []
                                }
                                arrayHistory.unshift(history)
                                await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                            }
                            req.flash('message', { error: 0, message: "Tạo đơn rút thành công vui lòng chờ duyệt" })
                            return res.redirect("/withdraw/bank")
                        }
                    } catch (error) {
                        req.flash('message', { error: 1, message: error.message })
                        return res.redirect("/withdraw/bank")
                    }
                }
            }
            else {
                return res.redirect("/withdraw/bank")
            }
        }
    }
}

WithDrawMomoView = async (req, res) => {
    var setting = await Setting.findOne({})
    var message = undefined
    const messFlash = req.flash('message')
    if (messFlash.length != 0) {
        if (messFlash[0].error == 1) {
            message = Helper.ErrorMessage(messFlash[0].message)
        }
        else {
            message = Helper.SuccessMessage(messFlash[0].message)
        }
    }
    const userBanks = await UserBank.find({ uid: req.user._id })
    var perPage = 9
    var page = req.query.page || 1
    var data = await Withdraw.find({ uid: req.user._id, "bank.gate": 2 }).skip((perPage * page) - perPage).limit(perPage).sort({ 'time': -1 });
    var count = await Withdraw.countDocuments({ uid: req.user._id, "bank.gate": 2 });
    const fees = await FeeOutMoney.find({ gate: 2 })
    res.render("index", { page: "withdraw/momo", user: req.user, userInfo: req.userInfo, message, userBanks, setting, data: data, current: page, pages: Math.ceil(count / perPage), fees })
}

WithDrawMomo = async (req, res) => {
    const { amount, stk, namestk, secret } = req.body

    if (req.userInfo.isActivePassLevel2 && !Helper.validPassword(secret, req.user.PasswordLevel2)) {
        req.flash('message', { error: 1, message: "Sai mật khẩu cấp 2." })
        return res.redirect("/withdraw/momo")
    }
    else {
        const setting = await Setting.findOne({})

        const feestsr = await FeeOutMoney.find({ gate: 2 })
        if (isNaN(amount)) {
            req.flash('message', { error: 1, message: "Số tiền nhập không hợp lệ." })
            return res.redirect("/withdraw/momo")
        }
        else if (amount < setting.withdraw.min || amount > setting.withdraw.max) {
            req.flash('message', { error: 1, message: "Số tiền cho phép từ " + setting.withdraw.min + " đến " + setting.withdraw.max })
            return res.redirect("/withdraw/momo")
        }
        else {

            const userInfo = await UserInfo.findOne({ uid: req.session.UserId })
            if (userInfo) {

                var moneyFee = 0
                for (let i = 0; i < feestsr.length; i++) {
                    if (feestsr[i].from <= amount && amount <= feestsr[i].to) {
                        if (feestsr[i].isfeeVnd) {
                            moneyFee = amount - feestsr[i].feeVnd
                        }
                        else {
                            moneyFee = amount - (amount * (feestsr[i].percent / 100))
                        }
                        break
                    }
                }
                if (moneyFee == 0) {
                    moneyFee = amount
                }
                if (userInfo.money < moneyFee) {
                    req.flash('message', { error: 1, message: "Không có đủ tiền để rút, bạn còn thiếu " + Helper.numberWithCommas(Math.round(userInfo.money - moneyFee)*-1) + " vnđ đã gồm phí" })
                    return res.redirect("/withdraw/momo")
                }
                else {
                    try {
                        const setAmount = await WidthDrawSetAmount(userInfo.uid, -moneyFee)
                        if (setAmount.error == 0) {

                            req.userInfo.money = setAmount.userinfo.money

                            var bankInfo = {
                                name: namestk,
                                stk: stk,
                                bankinfo: "Ví Momo",
                                gate: 2
                            }

                            const newWithDraw = await Withdraw({ transid: Helper.getTranidWithdraw(), amount: amount, bank: bankInfo, uid: req.user._id, username: req.user.Username, moneyfirst: req.userInfo.money }).save()
                            const history = await Historys({ transid: newWithDraw.transid, amount: -moneyFee, firtBalance: userInfo.money, lastBalance: setAmount.userinfo.money, content: "Rút tiền về " + bankInfo.bankinfo, uid: req.userInfo.uid }).save()

                            try {
                                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Rút tiền: " + newWithDraw.transid + "\nSố tiền: " + Helper.numberWithCommas(amount) + "\nRút về: " + bankInfo.bankinfo)

                            } catch { }


                            if (history) //Them vao redis cache
                            {
                                const keyHistory = "history"
                                const keyRedisHistory = keyHistory + req.userInfo.uid
                                const checkHistoryredis = await redisClient.get(keyRedisHistory)
                                var arrayHistory = JSON.parse(checkHistoryredis)
                                if (arrayHistory == null) {
                                    arrayHistory = []
                                }
                                arrayHistory.unshift(history)
                                await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                            }
                            req.flash('message', { error: 0, message: "Tạo đơn rút thành công vui lòng chờ duyệt" })
                            return res.redirect("/withdraw/momo")
                        }
                    } catch (error) {
                        req.flash('message', { error: 1, message: error.message })
                        return res.redirect("/withdraw/momo")
                    }
                }
            }
            else {
                return res.redirect("/withdraw/momo")
            }
        }
    }
}

WithDrawTsrView = async (req, res) => {
    var setting = await Setting.findOne({})
    var message = undefined
    const messFlash = req.flash('message')
    if (messFlash.length != 0) {
        if (messFlash[0].error == 1) {
            message = Helper.ErrorMessage(messFlash[0].message)
        }
        else {
            message = Helper.SuccessMessage(messFlash[0].message)
        }
    }
    const userBanks = await UserBank.find({ uid: req.user._id })
    var perPage = 9
    var page = req.query.page || 1
    var data = await Withdraw.find({ uid: req.user._id, "bank.gate": 1 }).skip((perPage * page) - perPage).limit(perPage).sort({ 'time': -1 });
    var count = await Withdraw.countDocuments({ uid: req.user._id, "bank.gate": 1 });
    const fees = await FeeOutMoney.find({ gate: 1 })
    res.render("index", { page: "withdraw/tsr", user: req.user, userInfo: req.userInfo, message, userBanks, setting, data: data, current: page, pages: Math.ceil(count / perPage), fees })
}

WithDrawTsr = async (req, res) => {
    const { amount, stk, namestk, secret } = req.body

    if (req.userInfo.isActivePassLevel2 && !Helper.validPassword(secret, req.user.PasswordLevel2)) {
        req.flash('message', { error: 1, message: "Sai mật khẩu cấp 2." })
        return res.redirect("/withdraw/tsr")
    }
    else {
        const setting = await Setting.findOne({})

        const feestsr = await FeeOutMoney.find({ gate: 1 })
        if (isNaN(amount)) {
            req.flash('message', { error: 1, message: "Số tiền nhập không hợp lệ." })
            return res.redirect("/withdraw/tsr")
        }
        else if (amount < setting.withdraw.min || amount > setting.withdraw.max) {
            req.flash('message', { error: 1, message: "Số tiền cho phép từ " + setting.withdraw.min + " đến " + setting.withdraw.max })
            return res.redirect("/withdraw/tsr")
        }
        else {

            const userInfo = await UserInfo.findOne({ uid: req.session.UserId })
            if (userInfo) {

                var moneyFee = 0
                for (let i = 0; i < feestsr.length; i++) {
                    if (feestsr[i].from <= amount && amount <= feestsr[i].to) {
                        if (feestsr[i].isfeeVnd) {
                            moneyFee = amount - feestsr[i].feeVnd
                        }
                        else {
                            moneyFee = amount - (amount * (feestsr[i].percent / 100))
                        }
                        break
                    }
                }
                if (moneyFee == 0) {
                    moneyFee = amount
                }
                if (userInfo.money < moneyFee) {
                    req.flash('message', { error: 1, message: "Không có đủ tiền để rút, bạn còn thiếu " + Helper.numberWithCommas(Math.round(userInfo.money - moneyFee)*-1) + " vnđ đã gồm phí" })
                    return res.redirect("/withdraw/tsr")
                }
                else {
                    try {
                        const setAmount = await WidthDrawSetAmount(userInfo.uid, -moneyFee)
                        if (setAmount.error == 0) {

                            req.userInfo.money = setAmount.userinfo.money

                            var bankInfo = {
                                name: namestk,
                                stk: stk,
                                bankinfo: "TheSieuRe.Com",
                                gate: 1
                            }

                            const newWithDraw = await Withdraw({ transid: Helper.getTranidWithdraw(), amount: amount, bank: bankInfo, uid: req.user._id, username: req.user.Username, moneyfirst: req.userInfo.money }).save()
                            const history = await Historys({ transid: newWithDraw.transid, amount: -moneyFee, firtBalance: userInfo.money, lastBalance: setAmount.userinfo.money, content: "Rút tiền về " + bankInfo.bankinfo, uid: req.userInfo.uid }).save()

                            try {
                                BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Rút tiền: " + newWithDraw.transid + "\nSố tiền: " + Helper.numberWithCommas(amount) + "\nRút về: " + bankInfo.bankinfo)

                            } catch { }


                            if (history) //Them vao redis cache
                            {
                                const keyHistory = "history"
                                const keyRedisHistory = keyHistory + req.userInfo.uid
                                const checkHistoryredis = await redisClient.get(keyRedisHistory)
                                var arrayHistory = JSON.parse(checkHistoryredis)
                                if (arrayHistory == null) {
                                    arrayHistory = []
                                }
                                arrayHistory.unshift(history)
                                await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                            }
                            req.flash('message', { error: 0, message: "Tạo đơn rút thành công vui lòng chờ duyệt" })
                            return res.redirect("/withdraw/tsr")
                        }
                    } catch (error) {
                        req.flash('message', { error: 1, message: error.message })
                        return res.redirect("/withdraw/tsr")
                    }
                }
            }
            else {
                return res.redirect("/withdraw/tsr")
            }
        }
    }
}

WithDrawView = async (req, res) => {
    var setting = await Setting.findOne({})
    var message = undefined
    const messFlash = req.flash('message')
    if (messFlash.length != 0) {
        if (messFlash[0].error == 1) {
            message = Helper.ErrorMessage(messFlash[0].message)
        }
        else {
            message = Helper.SuccessMessage(messFlash[0].message)
        }
    }
    const userBanks = await UserBank.find({ uid: req.user._id })
    var perPage = 9
    var page = req.query.page || 1
    var data = await Withdraw.find({ uid: req.user._id }).skip((perPage * page) - perPage).limit(perPage).sort({ 'time': -1 });
    var count = await Withdraw.countDocuments({ uid: req.user._id });
    res.render("index", { page: "withdraw/main", user: req.user, userInfo: req.userInfo, message, userBanks, setting, data: data, current: page, pages: Math.ceil(count / perPage) })
}

WidthDrawSetAmount = async (uid, amount) => {
    const session = await UserInfo.startSession();
    session.startTransaction();
    try {
        const userinfo = await UserInfo.findOneAndUpdate({ uid: uid }, { $inc: { money: amount } }, { new: true }).session(session)
        if (!userinfo) {
            throw new Error("Không tìm thấy from user");
        }
        else if (userinfo.money < 0) {
            throw new Error('Không đủ tiền để thực hiện: ' + (userinfo.money + amount));
        }
        await session.commitTransaction();
        session.endSession();
        return { error: 0, userinfo };
    } catch (error) {
        await session.abortTransaction()
        session.endSession();
        console.log(error)
        throw error;
    }
}

WithDrawPost = async (req, res) => {

    const { amount, bankinfo_id, secret } = req.body

    if (req.userInfo.isActivePassLevel2 && !Helper.validPassword(secret, req.user.PasswordLevel2)) {
        req.flash('message', { error: 1, message: "Sai mật khẩu cấp 2." })
        return res.redirect("/withdraw")
    }
    else {
        const setting = await Setting.findOne({})
        if (isNaN(amount)) {
            req.flash('message', { error: 1, message: "Số tiền nhập không hợp lệ." })
            return res.redirect("/withdraw")
        }
        else if (amount < setting.withdraw.min || amount > setting.withdraw.max) {
            req.flash('message', { error: 1, message: "Số tiền cho phép từ " + setting.withdraw.min + " đến " + setting.withdraw.max })
            return res.redirect("/withdraw")
        }
        else {
            const findBank = await UserBank.findOne({ uid: req.user._id, bank: bankinfo_id })
            if (findBank) {
                const userInfo = await UserInfo.findOne({ uid: req.session.UserId })
                if (userInfo) {
                    if (userInfo.money < amount) {
                        req.flash('message', { error: 1, message: "Không có đủ tiền để rút." })
                        return res.redirect("/withdraw")
                    }
                    else {
                        try {
                            const setAmount = await WidthDrawSetAmount(userInfo.uid, -amount)
                            if (setAmount.error == 0) {

                                req.userInfo.money = setAmount.userinfo.money
                                const newWithDraw = await Withdraw({ transid: Helper.getTranidWithdraw(), amount: amount, bank: findBank, uid: req.user._id, username: req.user.Username, moneyfirst: req.userInfo.money }).save()
                                const history = await Historys({ transid: newWithDraw.transid, amount: -amount, firtBalance: userInfo.money, lastBalance: setAmount.userinfo.money, content: "Rút tiền về " + findBank.bankinfo, uid: req.userInfo.uid }).save()

                                try {
                                    BotTelegram.sendMessage(process.env.GROUP_TELEGRAM_ID, "Rút tiền: " + newWithDraw.transid + "\nSố tiền: " + Helper.numberWithCommas(amount) + "\nRút về: " + findBank.bankinfo)

                                } catch { }


                                if (history) //Them vao redis cache
                                {
                                    const keyHistory = "history"
                                    const keyRedisHistory = keyHistory + req.userInfo.uid
                                    const checkHistoryredis = await redisClient.get(keyRedisHistory)
                                    var arrayHistory = JSON.parse(checkHistoryredis)
                                    if (arrayHistory == null) {
                                        arrayHistory = []
                                    }
                                    arrayHistory.unshift(history)
                                    await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                                }
                                req.flash('message', { error: 0, message: "Tạo đơn rút thành công vui lòng chờ duyệt" })
                                return res.redirect("/withdraw")
                            }
                        } catch (error) {
                            req.flash('message', { error: 1, message: error.message })
                            return res.redirect("/withdraw")
                        }
                    }
                }
                else {
                    return res.redirect("/withdraw")
                }
            }
            else {
                req.flash('message', { error: 1, message: "Không tìm thấy ngân hàng của bạn" })
                return res.redirect("/withdraw")
            }
        }
    }
}


SelectView = (req,res)=>{
    res.render("index", { page: "withdraw/select", user: req.user, userInfo: req.userInfo})
}

module.exports = { WithDrawView, WithDrawPost, WithDrawTsrView, WithDrawTsr,WithDrawMomo,WithDrawMomoView,WithDrawBankView,WithDrawBank ,

    WithDrawGt1s,WithDrawGt1sView
    ,WithDrawHome,WithDrawHomeView,
    SelectView
}