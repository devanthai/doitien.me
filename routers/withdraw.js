const router = require('express').Router()

const WithdrawController = require("../controllers/WithdrawController")

const UserSession = require("../middleware/GetUser") //Middleware Getuser

//Get User Middleware
router.use(UserSession)

//Middleware về đăng nhập nếu chưa đăng nhập
router.use((req, res, next) => {
    if (req.user != null && req.userInfo != null) {
        return next();
    }
    else {
        return res.redirect('/auth/login')

    }
})
router.get("/home",WithdrawController.WithDrawHomeView)
router.post("/home",WithdrawController.WithDrawHome)

router.get("/gt1s",WithdrawController.WithDrawGt1sView)
router.post("/gt1s",WithdrawController.WithDrawGt1s)

router.get("/bank",WithdrawController.WithDrawBankView)
router.post("/bank",WithdrawController.WithDrawBank)

router.get("/momo",WithdrawController.WithDrawMomoView)
router.post("/momo",WithdrawController.WithDrawMomo)

router.get("/tsr",WithdrawController.WithDrawTsrView)
router.post("/tsr",WithdrawController.WithDrawTsr)

router.get("/",WithdrawController.SelectView)
//router.post("/",WithdrawController.WithDrawPost)

module.exports = router
