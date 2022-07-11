const router = require('express').Router()
const ApiController = require("../controllers/ApiController")
const ApiSms = require("../controllers/ApiSms")


router.post("/callbackcard", ApiController.CallBackCard)
router.get("/callbackcard", (req, res) => {
    res.status(502).send("linkcard")
})

router.post("/sms",ApiSms.PostSms)
router.get("/sms",ApiSms.GetSms)



module.exports = router
