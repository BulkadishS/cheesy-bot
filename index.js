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
    {command: '/cheese', description: 'показать сыры (бонусы)'},
    {command: '/verify', description: 'проверка на бота'} 
])
console.log('bot running...')

// память о попытках и блокировке
const verifyAttempts = {}   // chatId - количество попыток
const blockedUsers = {}     // chatId - время конца блокировки
const verifiedUsers = {}    // chatId - прошел проверку или нет

const start = () => {
    bot.on('message', async msg => {
        const chatId = msg.chat.id
        const text = msg.text

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
                `📄 в белом списке: ${whitelist ? 'да🔒' : 'нет🔓'}\n` +
                `🤖 проверка на бота: ${verifiedUsers[chatId] ? '✅ пройдено' : '❌ не пройдено'}`
            )
        }

        // обычный список команд
        if (text === '/help') {
            bot.sendMessage(chatId, 
                '📖 список команд:\n' +
                '/start – запуск\n' +
                '/account – мой аккаунт\n' +
                '/cheese – показать свои бонусы (сыры)\n' +
                '/help – помощь\n' +
                '/verify – проверка на бота'
            )
        }

        // отдельная команда проверить бонусы
        if (text === '/cheese') {
            bot.sendMessage(chatId, `🧀 у тебя ${cheese} бонусных кусочков сыра`)
        }

        //  проверку на бота (капча)
        if (text === '/verify') {
            // если заблокирован то не даем выполнять
            if (blockedUsers[chatId] && Date.now() < blockedUsers[chatId]) {
                let waitMinutes = Math.ceil((blockedUsers[chatId] - Date.now()) / 60000)
                return bot.sendMessage(chatId, `🚫 Ты уже просрал все попытки, так нахуя возращаешься, приходи через ${waitMinutes} минут.`)
            }

            // сбрасываем попытки
            verifyAttempts[chatId] = 0

            bot.sendMessage(chatId, '🤖 Для подтверждения, что ты не бот, выбери правильный ответ:', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '2 + 2 = 4', callback_data: 'right' },
                            { text: '2 + 2 = 5', callback_data: 'wrong' }
                        ]
                    ]
                }
            })
        }
    })
}

// вызываем функцию
start()

// обработка нажатий кнопок для проверки на бота
bot.on('callback_query', async query => {
    const chatId = query.message.chat.id

    // правильный ответ
    if (query.data === 'right') {
        verifiedUsers[chatId] = true // сохраняем что прошел проверку
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }) // убираем кнопки
        bot.sendMessage(chatId, '✅ Проверка пройдена, доступ разрешён! Ты трушный сырочек')
        return
    }

    // неправильный ответ
    if (query.data === 'wrong') {
        verifyAttempts[chatId] = (verifyAttempts[chatId] || 0) + 1

        // если 3 попытки просраны
        if (verifyAttempts[chatId] >= 3) {
            blockedUsers[chatId] = Date.now() + 15 * 60 * 1000 // блокируем на 15 минут
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }) // убираем кнопки
            bot.sendMessage(chatId, '❌ Все попытки потрачены. Приходи через 15 минут! или вообще иди нахуй сырок подзалупный блять ублюдак')
        } else {
            // еще есть попытки
            let left = 3 - verifyAttempts[chatId]
            bot.sendMessage(chatId, `❌ Ошибка! Далбоеб не можешь решить такой пример у тебя осталось попыток: ${left}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '2 + 2 = 4', callback_data: 'right' },
                            { text: '2 + 2 = 5', callback_data: 'wrong' }
                        ]
                    ]
                }
            })
        }
    }
})

// шоб находило сырные ошыбки
bot.on('polling_error', console.error)
