const TelegramBot = require('node-telegram-bot-api');
const token = '5400072812:AAH2hHGFvjoUAQGXuNcJE8I5sY8JvQbhFv0';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId)
    
});
bot.on("polling_error", (data)=>{
    
});



module.exports = bot
