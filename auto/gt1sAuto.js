const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Deposit = require("../modules/Deposit")
const Setting = require("../modules/Setting")
const History = require("../modules/History")
const UserInfo = require("../modules/User/UserInfo")
const path = require('path')
const redisClient = require("../redisCache")
dotenv.config({ path: path.resolve(__dirname, '../.env') })
mongoose.connect(process.env.DB_CONNECT, () => console.log('Connected to db'));

const cheerioTableparser = require('cheerio-tableparser');

var browser = null
var page = null
var cookies = [
    {
        name: 'web_session',
        value: 'eyJpdiI6IjlpSDlOTXhNOStCRk5hMU9iN0ExRGc9PSIsInZhbHVlIjoiOWlEaERsXC9KVmVLbGpUS0RVSGhZcDZFbFlTaFFJNVwvVzFWdDdCMUZucWJzemV3UG9TVGM3eHVqUTZiZ0Q4UUNaIiwibWFjIjoiMTYyODNiODlmODk5ZTNmNzMyYWExODYxMmMyOWE2OGJlMTQzZWIwMTY5ZGYxNmM4YTExOWIwMjQ4MDRkNjNiZiJ9',
        domain: 'gachthe1s.com',
        path: '/',
        expires: 1657823867.139782,
        size: 255,
        httpOnly: true,
        secure: false,
        session: false,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'uid',
        value: 'eyJpdiI6Imh4eVoyQXVKZmtKVVNQek9ZZFhlb3c9PSIsInZhbHVlIjoiV0tJV1lSbHgrdW54ajc1Vk9lbGFOQT09IiwibWFjIjoiYjNhMzRlNjUwYTU2MmEwN2Q0YTE1MmUyOGM0Zjk3YjIxMTYyOTEzOWIyMWQ3NzljOGM3NjkzM2MwZDQ3NjExNCJ9',
        domain: 'gachthe1s.com',
        path: '/',
        expires: 1657984665.354045,
        size: 191,
        httpOnly: true,
        secure: false,
        session: false,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'client_info',
        value: 'eyJpdiI6Im9RbTVsOFgxeDBCdlFKVFdjMHhXanc9PSIsInZhbHVlIjoib2N1bHpYWERGODM4cnBTd2tXQWRQdz09IiwibWFjIjoiYTI4ZTg0MWY2MmJhMGNmM2RjYzM2OTZhZDkyZDY5ZjVmNzY5OTExNjk2ODYxZDc5MTZmNzU0MWFhMDBhN2Y0MCJ9',
        domain: 'gachthe1s.com',
        path: '/',
        expires: 1692376660.415874,
        size: 199,
        httpOnly: true,
        secure: false,
        session: false,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'PHPSESSID',
        value: 'h2shg3iu1uromsmgfa2c77kug8',
        domain: 'gachthe1s.com',
        path: '/',
        expires: -1,
        size: 35,
        httpOnly: false,
        secure: false,
        session: true,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'lang_code',
        value: 'eyJpdiI6InN2SzFCZ1ZzR1NFTjhReThCVkpXQ3c9PSIsInZhbHVlIjoiRGd1b0wzRTJRM3BLK1k3RlVTT1VzUT09IiwibWFjIjoiYTk2M2FmOWE4OTFjNjEzMWEzY2U2MDBmYmJhMGNjZDAyMjE1OTM2ZGM1NzQ2NzNlNDM3NWQ5MjU5ZDM5MDNiOSJ9',
        domain: 'gachthe1s.com',
        path: '/',
        expires: 1692376660.415851,
        size: 197,
        httpOnly: true,
        secure: false,
        session: false,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'XSRF-TOKEN',
        value: 'eyJpdiI6IkYyNWhNeHh1TUtyZDVUQ1RnNnVBQUE9PSIsInZhbHVlIjoiTUNvTE5zYll5S0FkYWVYVUJxU3crd1JneEpxOGJiT0pselNKYzNTZG85dWlxYkp2b3BqMUZialhqbU1aeEVcL04iLCJtYWMiOiJkMTdhM2ExMmFkZTNhZGYxNzUwNjRmODM2NTMyNzNmMjg1ZDVjZTgzOGQzMTE3ZjU0MmYzN2JkZWY5NjVlMGIyIn0%3D',
        domain: 'gachthe1s.com',
        path: '/',
        expires: 1657823867.139309,
        size: 256,
        httpOnly: false,
        secure: false,
        session: false,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'user_secure',
        value: 'eyJpdiI6IkI2eWNzRHhaUDJ4UlVPcG9KTXVBd1E9PSIsInZhbHVlIjoidDhWVGpvQlcxd1IzaEp5dmQzUVhvYzJIS05XeDFVM3hOeVlaajBhc0NNQkR4dUtyTU03TTJRd0phTldNZkxNMiIsIm1hYyI6ImZlNjAyOThmZTMxNjc0MDJlY2E5Y2MxZTFhNmY5ZjlhODQ3YTg2ZmFjNjA3NmNiMmE2YTA5M2Y1MjNhZTgwNTUifQ%3D%3D',
        domain: 'gachthe1s.com',
        path: '/',
        expires: 1657888665.353979,
        size: 259,
        httpOnly: true,
        secure: false,
        session: false,
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },
    {
        name: 'TCK',
        value: '17621b009a9c7a502ef89b2ed24253dd',
        domain: 'gachthe1s.com',
        path: '/',
        expires: -1,
        size: 35,
        httpOnly: false,
        secure: true,
        session: true,
        sameSite: 'None',
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    }
]
var content = null
auto = async () => {
    try {
        const setting = await Setting.findOne({})
        console.log(setting.autoDeposit.Gt1s)
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--single-process', '--no-zygote'], headless: false });
        page = await browser.newPage();
        if (cookies == null) {
            await page.goto('https://gachthe1s.com/account/login', { waitUntil: 'networkidle0' });
            await page.waitForTimeout(2000)
            await page.type("#username", setting.autoDeposit.Gt1s.username);
            await page.type("#password", setting.autoDeposit.Gt1s.password);
            await page.click("button[type='submit']")
        }
        else {
            await page.setCookie(...cookies);

        }
        await page.waitForTimeout(2000)
        await page.goto('https://gachthe1s.com/wallet/transfer', { waitUntil: 'networkidle0' });
        content = await page.content()
        if (content.includes("10,000,000")) {

            cookies = await page.cookies()
           // console.log(cookies)
            const $ = cheerio.load(content, {
                normalizeWhitespace: true,
                xmlMode: true
            });
            cheerioTableparser($);
            var data = $(".col-sm-12.table-responsive").parsetable(true, true, true);
            for (var i = 1; i < data[0].length; i++) {
                var magd = data[0][i];
                var sotien = data[1][i];
                var ten = data[2][i];
                var time = data[3][i];
                var status = data[4][i];
                var description = data[5][i].toLowerCase();
                var creditAmount = Number(sotien.replace(/,/g, '').replace("đ", ''))
               


                const deposits = await Deposit.find({ $text: { $search: description }, status: 0 })
                var donpick = null
                deposits.forEach(elementz => {
                    if (description.search(elementz.content.toLowerCase()) != -1) {
                        donpick = elementz
                    }
                });

                if (donpick != null && donpick.gate.toLowerCase().includes("gt1s")) {
                    if (creditAmount == donpick.amount && description.split("naptien").length == 2) {
                        await Deposit.findByIdAndUpdate(donpick._id, { status: 1 })
                        var userI = await UserInfo.findOneAndUpdate({ uid: donpick.uid }, { $inc: { money: donpick.amount } })
                        const history = await History({ transid: donpick.transid, amount: creditAmount, firtBalance: userI.money, lastBalance: userI.money + creditAmount, content: "Nạp tiền từ GT1S", uid: donpick.uid }).save()
                        if (history) {
                            const keyHistory = "history"
                            const keyRedisHistory = keyHistory + donpick.uid
                            const checkHistoryredis = await redisClient.get(keyRedisHistory)
                            var arrayHistory = JSON.parse(checkHistoryredis)
                            if (arrayHistory == null) {
                                arrayHistory = []
                            }
                            arrayHistory.unshift(history)
                            await redisClient.set(keyRedisHistory, JSON.stringify(arrayHistory))
                        }
                    }
                }

                console.log(magd + "|" + noidung + "|" + sotien)
            }
        }
        else {
            cookies = null
        }
        await page.close()
        await browser.close();
    } catch (error) {
        await page.close()
        await browser.close();
    }
}
auto()
setInterval(async () => {
    auto()
}, 60000)
