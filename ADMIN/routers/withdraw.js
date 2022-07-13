const router = require('express').Router()
const withdrawController = require("../controllers/withDrawController")

router.post("/setting/addfee",withdrawController.addFee)
router.post("/setting/removeFee",withdrawController.removeFee)

router.get("/setting",withdrawController.configView)
router.post("/setting/savesetting",withdrawController.saveSetting)
router.get("/listWithdraw",withdrawController.withDraw)
router.get("/chuaduyet",withdrawController.ChuaDuyetView)
router.get("/daduyet",withdrawController.DaDuyetView)
router.get("/dahuy",withdrawController.DaHuyView)
router.post("/setsuccess",withdrawController.setSuccess)
router.post("/setFail",withdrawController.setFail)



module.exports = router