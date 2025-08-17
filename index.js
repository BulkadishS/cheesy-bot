// токен берем с .env файла
require('dotenv').config()
const token = process.env.BOT_TOKEN
// берем апишку
const TelegramApi = require('node-telegram-bot-api')

// создаем бота, делая ему параметры(токен и прочая хуйня кароче сыр залупа)
const bot = new TelegramApi(token, {polling: true})
console.log('bot running...')

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'test')
    console.log(chatId)
})

bot.on('message', (msg) => {
    if (typeof msg.text !== 'string') return
    const chatId = msg.chat.id
    if (!msg.text.startsWith('/')) {
        switch (msg.text) {
            case 'хуй':
                return bot.sendMessage(chatId, 'ПОШЕЛ НАХУЙ')
            case 'сосал':
                return bot.sendMessage(chatId, 'да')
            case 'ты любишь сыр':
                return bot.sendMessage(chatId, 'да')
        }
        bot.sendMessage(chatId, msg.text)
    }
})