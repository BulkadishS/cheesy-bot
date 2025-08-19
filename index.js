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
    {command: '/account', description: 'мой аккаунт'},
    {command: '/help', description: 'список команд'},
    {command: '/cheese', description: 'показать сыры (бонусы)'} 
])
console.log('bot running...')

const start = () => {
    bot.on('message', async msg => {
        // создаем переменные и присваиваем к ним грубо говоря короткие названия шобы красиво все сморелось не сырно
        const chatId = msg.chat.id
        const text = msg.text
        // баланс в рублях и бонусные сыры также тот белый список
        let balance = Math.floor(Math.random() * 5000); // баланс случайный для прикола
        let cheese = Math.floor(Math.random() * 20); // количество сыра (бонусов)
        let whitelist = false;

        // команда старт
        if (text === '/start') {
            bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/76b/596/76b59687-4b1f-383f-80e1-8289192f8bb2/12.webp')
            bot.sendMessage(chatId, '🧀 здарова 🧀, хочешь кому то наебашить телефон гудками или смсками, тебе к нам! \n\n Снизу увидишь все возможности этого ебаного бота')
        }

        // личный кабинет для сыров
        if (text === '/account') {
            bot.sendMessage(chatId, 
                `🏦 Твой личный кабинет , ${msg.from.first_name}🧀 \n\n` +
                `💳 баланс: ${balance} ₽\n` +
                `🧀 бонусы (сыры): ${cheese}\n` +
                `📄 в белом списке: ${whitelist ? 'да🔒' : 'нет🔓'}`
            )
        }

        // обычный список команд
        if (text === '/help') {
            bot.sendMessage(chatId, 
                '📖 список команд:\n' +
                '/start – запуск\n' +
                '/account – мой аккаунт\n' +
                '/cheese – показать свои бонусы (сыры)\n' +
                '/help – помощь'
            )
        }

        // отдельная команда проверить бонусы
        if (text === '/cheese') {
            bot.sendMessage(chatId, `🧀 у тебя ${cheese} бонусных кусочков сыра`)
        }
    })

}

// вызываем функцию
start()
// шоб находило сырные ошыбки
bot.on('polling_error', console.error)
