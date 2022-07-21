const Deposit = require("../modules/Deposit")
const Withdraw = require("../modules/Withdraw")
const UserInfo = require("../modules/User/UserInfo")

DoanhThuToTalFee = async () => {
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sumFee = await Withdraw.aggregate([{ $match: { time: { $gte: startOfToday } }, }, { $group: { _id: null, totalFee: { $sum: "$fee" } } }])
    if (sumFee[0]) {
        return sumFee[0].totalFee
    }
    else {
        return 0
    }
}
ToTalAmountUser = async () => {
    const sumFee = await UserInfo.aggregate([{ $match: { }, }, { $group: { _id: null, totalAmount: { $sum: "$money" } } }])
    if (sumFee[0]) {
        return sumFee[0].totalAmount
    }
    else {
        return 0
    }
}

NapTienDoanhThu = async (date) => {
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(),now.getDate());
    if(date=="thang")
    {
        startOfToday = new Date(now.getFullYear(), now.getMonth());
    }
    var zzz = await Deposit.aggregate([
        { $match: { time: { $gte: startOfToday } ,status:1} }
        ,
        {
            $group: {
                _id: {
                    "gate": "$gate",
                },
                "totalAmount": { $sum: "$amount" }
            }
        },
        {
            "$project": {
                "_id": 0,
                "gate": "$_id.gate",
                "totalAmount": "$totalAmount"
            }
        },
       // { $sort: { "totalAmount": -1 } }
    ])
    return zzz
}


RutTienThongKe = async (date) => {
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(),now.getDate());
    if(date=="thang")
    {
        startOfToday = new Date(now.getFullYear(), now.getMonth());
    }
    var zzz = await Withdraw.aggregate([
        { $match: { time: { $gte: startOfToday } } }
        ,
        {
            $group: {
                _id: {
                    "gate": "$bank.gate",
                },
                "totalAmount": { $sum: "$amount" }
            }
        },
        {
            "$project": {
                "_id": 0,
                "gate": "$_id.gate",
                "totalAmount": "$totalAmount"
            }
        },
        { $sort: { "gate": 1 } }
    ])
    zzz.forEach((item)=>{
        if(item.gate=="1")
        {
            item.gate = "ThesieuRe"
        }
        else if(item.gate=="2")
        {
            item.gate = "Momo"
        }
        else if(item.gate=="3")
        {
            item.gate = "Bank"
        }
        else if(item.gate=="4")
        {
            item.gate = "Gachthe1s"
        }
        else if(item.gate=="5")
        {
            item.gate = "Về nhà"
        }
    })
    return zzz
}
module.exports = {
    DoanhThuToTalFee,
    NapTienDoanhThu,
    RutTienThongKe,
    ToTalAmountUser
}