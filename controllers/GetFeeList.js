
const CardFee = require("../modules/CardFee")
const Setting = require("../modules/Setting")

GetFee = async () => {
    const setting = await Setting.findOne({})
    var cardFee = await CardFee.aggregate([
        {
            $group: {
                _id: "$telco", list: { $push: "$$ROOT" }
            }
        }
    ])
    cardFee.forEach(item => {
        item.list.sort(function (a, b) {
            return parseFloat(a.value) - parseFloat(b.value);
        });
    })
    const listSort = setting.sortFeeCard
    var listFee = []
    listSort.forEach(item => {
        for (let i = 0; i < cardFee.length; i++) {
            if (item == cardFee[i]._id) {
                if (item == 'VIETTEL') {
                    cardFee[i].title = "Viettel"
                }
                else if (item == 'VINAPHONE') {
                    cardFee[i].title = "Vina"
                }
                else if (item == 'MOBIFONE') {
                    cardFee[i].title = "Mobifone"
                }
                else if (item == 'VNMB' || item == "VNMOBI") {
                    cardFee[i].title = "Vietnammobi"
                }
                else {
                    cardFee[i].title = cardFee[i]._id
                }
                var maxles = cardFee[i].list[0].fees
                var minless = cardFee[i].list[0].fees
                for (let iz = 1; iz < cardFee[i].list.length; iz++) {
                    if (cardFee[i].list[iz].fees > maxles) {
                        maxles = cardFee[i].list[iz].fees;
                    }
                    if (cardFee[i].list[iz].fees < minless) {
                        minless = cardFee[i].list[iz].fees;
                    }
                }
                cardFee[i].maxfee = (100 - minless)-setting.upFee
                cardFee[i].minfee = (100 - maxles)
                listFee.push(cardFee[i])
            }
        }
    })
    return listFee
}
module.exports = GetFee