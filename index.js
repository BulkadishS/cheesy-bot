// токен берем с .env файла
require('dotenv').config()
const token = process.env.BOT_TOKEN
// берем апишку
const TelegramApi = require('node-telegram-bot-api')

// создаем бота, делая ему параметры(токен и прочая хуйня кароче сыр залупа)
const bot = new TelegramApi(token, {polling: true})


// тут короч темка шоб когда нажимал кнопку возле чата быстрый доступ удобно короч
bot.setMyCommands([
    {command: '/start', description: 'начало'},
    {command: '/account', description: 'мой аккаунт'}
])
console.log('bot running...')

const start = () => {
    bot.on('message', async msg => {
        // создаем переменные и присваиваем к ним грубо говоря короткие названия шобы красиво все сморелось не сырно
        const chatId = msg.chat.id
        const text = msg.text
        // балик и тот самый белый список
        let balance = 0;
        let whitelist = false;

        // тут понятно я думаю
        if (text === '/start') {
            bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/76b/596/76b59687-4b1f-383f-80e1-8289192f8bb2/12.webp')
            bot.sendMessage(chatId, '🧀 здарова 🧀, хочешь кому то наебашить телефон гудками или смсками, тебе к нам! \n\n Снизу увидишь все возможности этого ебаного бота')
        }

        // тут нужно будет сразу 2 связать это балик и белый список короч понятно нахуй я пишу это
        if (text === '/account') {
            bot.sendMessage(chatId, `🏦 Твой личный кабинет , ${msg.from.first_name}🧀 \n\n 💳баланс: ${balance}₽ \n 📄в белом списке: ${whitelist ? 'да🔒' : 'нет🔓'}`)
        }
    })

}

// вызываем функцию
start()
// шоб находило сырные ошыбки
bot.on('polling_error', console.error)