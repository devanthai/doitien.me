let mongoose = require('mongoose');
let Schema = new mongoose.Schema({
    gate: { type: Number, required: true },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    feeVnd: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    isfeeVnd: { type: Boolean, required: true }
});
module.exports = mongoose.model('FeeOutMoney', Schema);