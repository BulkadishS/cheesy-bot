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
    {command: '/balance', description: 'балик'},
    {command: '/help', description: 'список команд'},
    {command: '/cheese', description: 'показать сыры (бонусы)'},
])
console.log('bot running...')


const userData = {} // *декларируем объект для создания анкеты юзера(все параметры)
let cheese = Math.floor(Math.random() * 20) // количество сыра (бонусов)


const start = () => {
    bot.on('message', async msg => {
        const chatId = msg.chat.id
        const userId = msg.from.id
        const text = msg.text
        // *шаблонная уникальная анкета для каждого юзера
        if (!userData[userId]) {
            userData[userId] = {
                // уникальная капча для юзера
                userCaptcha: undefined,        
                // сколько попыток осталось у юзера в одном шансе
                captchaAttempts: 3,            
                // сколько шансов всего (каждый шанс = 3 попытки и если провалил шанс = гуляешь час)
                chancesLeft: 3,                
                // голда не на балике
                balance: 0,                    
                // чушпан или нет
                whitelist: false,              
                // проверен ли хуй этот
                verifiedUsers: false,          
                // бан навсегда если высрал все шансы
                banned: false,                 
                // таймер бана на час между шансами
                banUntil: undefined            
            }
        }
        // ПРОВЕРКА ДАННЫХ ЮЗЕРА (норм тема ода)
        console.log(userData[userId])

        // лан опишу как капча работает ПРОЧИТАЙ ПОЛЕЗНО НАХУЙ
        // читаюююююююю но надо подработать момент
        function captcha() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            let captchaResult = ''
            for (let i = 0; i < 6; i++) {
                captchaResult += chars[Math.floor(Math.random() * chars.length)]
            }
            return captchaResult
        }

        // проверка на вечный бан
        if (userData[userId].banned) {
            bot.sendMessage(chatId, 'доступ закрыт навсегда, ты высрал все шансы на капче') // второе объявление нужно не трогатьььь
            return
        }

        // если часовой бан активен после провала шанса то пусть ждет лох
        if (userData[userId].banUntil && Date.now() < userData[userId].banUntil) {
            const mins = Math.ceil((userData[userId].banUntil - Date.now()) / 60000)
            bot.sendMessage(chatId, `⌛ отдыхай ещё ${mins} мин и приходи по /start`)
            return
        }

        // если час прошёл потом чистим бан
        if (userData[userId].banUntil && Date.now() >= userData[userId].banUntil) {
            delete userData[userId].banUntil
        }

switch (text) {
    case '/start':
        if (!userData[userId].verifiedUsers) {
            if (userData[userId].chancesLeft <= 0) {
                userData[userId].banned = true
                bot.sendMessage(chatId, ' ты высрал все шансы, доступ закрыт навсегда')
                return
            }
            const sendCaptcha = captcha()
            userData[userId].userCaptcha = sendCaptcha
            userData[userId].captchaAttempts = 3
            bot.sendMessage(chatId, 'шо ты лысый🧀😂, пройди проверку на бота \n\n⌨️ введи то что написано ниже и отправь:\n\n' + sendCaptcha)
            return
        }
        bot.sendMessage(chatId, '✅ ты уже проверен, можешь работать дальше. если надо меню, глянь /help')
        break

    case '/account':
        bot.sendMessage(chatId, 
            `🏦 Твой личный кабинет , ${msg.from.first_name}🧀 \n\n` +
            `💳 баланс: ${userData[userId].balance} ₽\n` +
            `🧀 бонусы (сыры): 🧀${cheese}\n` +
            `📄 в белом списке: ${userData[userId].whitelist ? '🔒да' : '🔓 нет'}\n` +
            `🤖 проверка на бота: ${userData[userId].verifiedUsers ? '✅ пройдено' : '❌ ошибка'}` 
        )
        break
    
    case '/balance':
        bot.sendMessage(chatId, 'test')
        break

    case '/help':
        bot.sendMessage(chatId, 
            '📖 список команд:\n' +
            '/start – запуск\n' +
            '/account – мой аккаунт\n' +
            '/balance - голда на балике\n' +
            '/cheese – показать свои бонусы (сыры)\n' +
            '/help – помощь\n'
        )
        break

    case '/cheese':
        bot.sendMessage(chatId, `🧀у тебя на счету: ${cheese} 🧀 бонусных сыров!`)
        break

default:
    // если юзер ещё не прошёл капчу и она у него есть
    if (!userData[userId].verifiedUsers && userData[userId].userCaptcha) {
        //  если капча введена норм
        if (text === userData[userId].userCaptcha) {
            userData[userId].verifiedUsers = true // отмечаем, что проверка пройдена
            bot.sendMessage(chatId, '✅ проверка пройдена сыр ебанный, теперь ты можешь пройти дальше по той же команде /start')
            // очищаем нах ненужные данные
            delete userData[userId].userCaptcha
            delete userData[userId].captchaAttempts
            delete userData[userId].chancesLeft
            delete userData[userId].banUntil
        } else {
            //  если капча введена неправильно
            if (userData[userId].captchaAttempts > 0) {
                userData[userId].captchaAttempts-- 
                const left = userData[userId].captchaAttempts
                await bot.sendMessage(chatId, `введено неправильно, осталось попыток: ❗ ${left} ❗`)

                // если попытки закончились
                if (userData[userId].captchaAttempts === 0) {
                    userData[userId].chancesLeft-- 
                    
                    // если шансов больше нет то бан навсегда
                    if (userData[userId].chancesLeft <= 0) {
                        userData[userId].banned = true
                        await bot.sendMessage(chatId, ' ты высрал все шансы (3 из 3), доступ закрыт навсегда ')
                        return
                    }

                    // если шансы ещё есть то бан на 1 час
                    userData[userId].banUntil = Date.now() + 60 * 60 * 1000 // 1 час
                    userData[userId].captchaAttempts = 3 // обновляем попытки для следующей капчи
                    delete userData[userId].userCaptcha // удаляем старую капчу

                    await bot.sendMessage(chatId, `ты проебал 3 попытки. осталось шансов: ${userData[userId].chancesLeft}. жди 1 час и приходи снова по /start`)
                    return
                }
            }
        }
    }
}
})
}
// вызываем функцию
start()
// шоб находило сырные ошыбкиt()
bot.on('polling_error', console.error)
