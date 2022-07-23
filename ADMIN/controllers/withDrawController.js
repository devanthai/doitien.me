
const Setting = require("../modules/Setting")
const WithDraw = require("../modules/Withdraw")
const FeeOutMoney = require("../modules/FeeOutMoney")

configView = async (req, res) => {
    const setting = await Setting.findOne({})
    const feeout = await FeeOutMoney.find({})
    res.render("index", { page: "pages/withdraw/setting", setting, feeout })
}
saveSetting = async (req, res) => {
    const { hanmucngay, min, max } = req.body
    try {
        await Setting.findOneAndUpdate({}, { "withdraw.totalday": Number(hanmucngay), "withdraw.min": Number(min), "withdraw.max": Number(max) })
        res.json({ error: 0, message: "CHỉnh sửa thành công" })
    } catch {
        res.json({ error: 1, message: "CHỉnh sửa thất bai" })
    }
}
ChuaDuyetView = async (req, res) => {
    const listWithdraws = await WithDraw.find({ status: -1 }).sort({ time: -1 })
    res.render("index", { page: "pages/withdraw/listWithdraw", listWithdraws })
}

DaHuyView = async (req, res) => {
    const listWithdraws = await WithDraw.find({ status: 2 }).sort({ time: -1 })
    res.render("index", { page: "pages/withdraw/listWithdraw", listWithdraws })
}
DaDuyetView = async (req, res) => {
    const listWithdraws = await WithDraw.find({ status: 1 }).sort({ time: -1 })
    res.render("index", { page: "pages/withdraw/listWithdraw", listWithdraws })
}
withDraw = async (req, res) => {
    const listWithdraws = await WithDraw.find({}).sort({ time: -1 })
    res.render("index", { page: "pages/withdraw/listWithdraw", listWithdraws })
}
autoTransferConfigView = async (req, res) => {
    const setting = await Setting.findOne({})
    res.render("index", { page: "pages/withdraw/configAuto", setting })
}


setSuccess = async (req, res) => {
    const id = req.body.id
    try {
        const wi = await WithDraw.findOneAndUpdate({ _id: id, status: -1 }, { status: 1 })
        res.json({ error: 0, message: "Thanh cong" })
    } catch (error) {
        res.json({ error: 1, message: "loi " + error })
    }
}

setFail = async (req, res) => {
    const id = req.body.id
    try {
        const wi = await WithDraw.findOneAndUpdate({ _id: id, status: -1 }, { status: 2 })
        res.json({ error: 0, message: "Ok " })
    } catch (error) {
        res.json({ error: 1, message: "loi " + error })
    }
}
removeFee = async (req, res) => {
    const _id = req.body.id
    try {
        await FeeOutMoney.findOneAndRemove({ _id: _id })
        res.json({ error: 0, message: "Xóa phí thành công" })
    }
    catch {
        res.json({ error: 1, message: "Xóa phí thất bại" })
    }
}
addFee = async (req, res) => {
    var { gaterut, rutfrom, rutto, typefee, moneyfee } = req.body
    try {
        if (typefee == 1) {
            new FeeOutMoney({ gate: Number(gaterut), from: Number(rutfrom), to: Number(rutto), feeVnd: Number(moneyfee), isfeeVnd: true }).save()
        }
        else {
            new FeeOutMoney({ gate: Number(gaterut), from: Number(rutfrom), to: Number(rutto), percent: Number(moneyfee), isfeeVnd: false }).save()
        }
        res.json({ error: 0, message: "Ok" })
    } catch (error) {
        res.json({ error: 1, message: "loi " + error })
    }
}
module.exports = { configView, saveSetting, withDraw, setSuccess, setFail, ChuaDuyetView, DaDuyetView, DaHuyView, addFee, removeFee,autoTransferConfigView }