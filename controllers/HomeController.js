const GetListFee = require("../controllers/GetFeeList")
const Setting = require("../modules/Setting")

module.exports = async (req, res) => {

    var setting = await Setting.findOne({})
    if (!setting) {
        setting = await new Setting({}).save()
    }
    const listFee = await GetListFee()
    
    console.log('Hello');
    res.render("index", { page: "home", user: req.user, userInfo: req.userInfo, fees: listFee ,setting});
}