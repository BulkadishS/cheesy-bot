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
    {command: '/verify', description: 'проверка на бота'}
])
console.log('bot running...')


const userCaptcha = {} // правильные ответы на капчу, на каждого пользователя сырного
const verifiedUsers = {} // кто уже прошёл капчу — больше не доебываемся
const captchaAttempts = {} // *попытки для капчи
// const userTimeouts = {} // *таймаут для ебланов, которые завалили капчу (будущее обновление)
let balance = Math.floor(Math.random() * 5000) // баланс (будущая обнова)
let cheese = Math.floor(Math.random() * 20) // количество сыра (бонусов)
let whitelist = false


const start = () => {
    bot.on('message', async msg => {
        const chatId = msg.chat.id
        const userId = msg.from.id
        const text = msg.text

        // лан опишу как капча работает ПРОЧИТАЙ, ПОЛЕЗНО НАХУЙ
        function captcha() {
            // кароче бля буковки которые будут фасоваться в переменной ниже
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            // пустая галерка, шоб в них чето хуярить
            let captchaResult = ''
            // цикл, где указано что длина капчи максимум 6 символов, и она будет собираться из букв выше
            for (let i = 0; i < 6; i++) {
                captchaResult += chars[Math.floor(Math.random() * chars.length)]
            }
            // пуляем результат глобально по всему коду, потому шо оно только в функции работает шариш да
            return captchaResult
        }

        switch (text) {
            //проверка на капчу(обнова)
            case '/start':
                // *ЕСЛИ ТИП ЗАЕБЛАНИЛ КАПЧУ ТО ОН КАК САШУК ПОД ХАРЬКОВОМ БУДЕТ
                if (!verifiedUsers[userId] && captchaAttempts[userId] === 0) {
                    console.log(`сколько попыток осталось после хуйни всей: ` + captchaAttempts[userId])
                    bot.sendMessage(chatId, 'ПОШЕЛ НАХУЙ УЕБИЩЕ')
                    return
                }
                // *отсылаем капчу если навичок
                if (!verifiedUsers[userId]) {
                    // ВАЖНО, сендкапча это мы объвляем ту самую капчу которая закрытая в функции была
                    const sendCaptcha = captcha()
                    userCaptcha[userId] = sendCaptcha
                    captchaAttempts[userId] = 4
                    bot.sendMessage(chatId, 'Шо ты лысый🧀😂, пройди проверку на бота епта \n\n⌨️ введи то что написано ниже и отправь:\n\n' + sendCaptcha)
                    return
                }
                // *если навичок то похуй на нево
                bot.sendMessage(chatId, '✅ Ты уже проверен, можешь работать дальше.И если надо меню, глянь /help')
                console.log(`проверен на капче?: ${verifiedUsers[userId] ? 'да' : 'ошибка'}`)
                break

            case '/account':
                // личный кабинет для сыров
                bot.sendMessage(chatId, 
                    `🏦 Твой личный кабинет , ${msg.from.first_name}🧀 \n\n` +
                    `💳 баланс: ${balance} ₽\n` +
                    `🧀 бонусы (сыры): 🧀${cheese}\n` +
                    `📄 в белом списке: ${whitelist ? '🔒да' : '🔓 нет'}\n` +
                    `🤖 проверка на бота: ${verifiedUsers[userId] ? '✅ пройдено' : '❌ ошибка'}`
                )
                break
            
            case '/balance':
                bot.sendMessage(chatId, 'test')
                break

            case '/help':
                // обычный список команд
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
                // отдельная команда проверить бонусы
                bot.sendMessage(chatId, `🧀У тебя на счету: ${cheese} 🧀 бонусных сыров!`)

            // *проверка на капчу, перенес с обновой
            default:
                if (!verifiedUsers[userId] && userCaptcha[userId]) {
                    // *проверяем верно тип отправил капчу чи не
                    if (text === userCaptcha[userId]) {
                        verifiedUsers[userId] = true
                        bot.sendMessage(chatId, '✅Проверка пройдена сыр ебанный, теперь ты можешь пройти дальше по той же команде /start')
                        delete captchaAttempts[userId]
                    } else {
                        // *папытки на капче, короче вместо цикла ебучий иф который выглядит убого нахуй
                        if (captchaAttempts[userId] > 0) {
                            captchaAttempts[userId]--
                            await bot.sendMessage(chatId, `❌ Введено неправильно, осталось попыток: ❗ ${captchaAttempts[userId]} ❗`)
                            // *если ПРОЕБАЛСЯ, то лох ебанный
                            if (captchaAttempts[userId] === 0) {
                                await bot.sendMessage(chatId, '⛔ Капча не была пройдена еблан, пососи')
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
// шоб находило сырные ошыбки
bot.on('polling_error', console.error)
