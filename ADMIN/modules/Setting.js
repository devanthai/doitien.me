let mongoose = require('mongoose');
let Schema = new mongoose.Schema({

    deposit: {
        totalday: { type: Number, default: 10000000 },
        minin: { type: Number, default: 50000 },
        maxin: { type: Number, default: 1990000 }
    },
    withdraw: {
        totalday: { type: Number, default: 10000000 },
        min: { type: Number, default: 100000 },
        max: { type: Number, default: 300000000 }
    },
    apicard: {
        partner_id: { type: String, default: "1516250561" },
        partner_key: { type: String, default: "5ed8f4ac13786a721582b81a257578fb" },
        url: { type: String, default: "https://thesieure.com/chargingws/v2" }
    },
    autoDeposit: {
        MBbank: {
            isRunning: { type: Boolean, default: true },
            username: { type: String, default: "0369004565" },
            password: { type: String, default: "Tanh0917" },
            accountNumber: { type: String, default: "0090156190000" },
            urlApi: { type: String, default: "https://mbbank.the9sao.com/api/mbb/getTransactions" },
        },
        Momo: {
            phoneNumber: { type: String, default: "0367890167" },
            urlApi: { type: String, default: "https://momo.the9sao.com/getgd" },
        },
        Tsr: {
            username: { type: String, default: "xnm4bren" },
            password: { type: String, default: "thaieahleo13" }
        }
    },
    thongbao: { type: String, default: "bung tè le ahihi" },
    title: { type: String, default: "Webvip" },
    sortFeeCard: { type: Array, default: ['VIETTEL', 'VINAPHONE', 'MOBIFONE', 'VNMOBI', 'ZING', 'GATE'] },
    sortBuyCard: { type: Array, default: ['VIETTEL', 'VINAPHONE', 'MOBIFONE', 'VNMOBI', 'ZING', 'GATE'] },
    upFee: { type: Number, default: 1 }
});
module.exports = mongoose.model('Setting', Schema);