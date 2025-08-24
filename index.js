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
        // *шаблонная уникальная анкета для каждого юзера(желательно проверять консоль логом при разработке сырной)
        if (!userData[userId]) {
            userData[userId] = {
                // уникальная капча для юзера
                userCaptcha: undefined,
                // сколько попыток осталось у юзера(при верификации уже удаляется)
                captchaAttempts: 4,
                // голда не на балике
                balance: 0,
                // чушпан или нет
                whitelist: false,
            // проверен ли хуй этот
                verifiedUsers: false
            }
        }
        // ПРОВЕРКА ДАННЫХ ЮЗЕРА !!!!!!!!!!!!!!!!!!!!!!!!!!! самое главное нахуй оно жизнь спасло мне и золочеву
        console.log(userData[userId])

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

        // ЕСЛИ ТИП ЗАЕБЛАНИЛ КАПЧУ ТО КАК САШУКА ПОД ЗОЛОЧЕВ
        if (userData[userId].captchaAttempts === 0 && !['/start'].includes(text) && text !== userData[userId]?.userCaptcha) {
            bot.sendMessage(chatId, `вам запрещен доступ изза фейла капчи`)
            return
        }
        switch (text) {
            //проверка на капчу(обнова)
            case '/start':
                // *отсылаем капчу если навичок
                if (!userData[userId].verifiedUsers) {
                    // ВАЖНО, сендкапча это мы объвляем ту самую капчу которая закрытая в функции была
                    const sendCaptcha = captcha()
                    userData[userId].userCaptcha = sendCaptcha
                    bot.sendMessage(chatId, 'Шо ты лысый🧀😂, пройди проверку на бота епта \n\n⌨️ введи то что написано ниже и отправь:\n\n' + sendCaptcha)
                    return
                }
                // *если навичок то похуй на нево
                bot.sendMessage(chatId, '✅ Ты уже проверен, можешь работать дальше.И если надо меню, глянь /help')
                console.log(`проверен на капче?: ${userData[userId].verifiedUsers ? 'да' : 'ошибка'}`)
                break

            case '/account':
                // личный кабинет для сыров
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
                if (!userData[userId].verifiedUsers && userData[userId].userCaptcha) {
                    // *проверяем верно тип отправил капчу чи не
                    if (text === userData[userId].userCaptcha) {
                        userData[userId].verifiedUsers = true
                        bot.sendMessage(chatId, '✅Проверка пройдена сыр ебанный, теперь ты можешь пройти дальше по той же команде /start')
                        delete userData[userId].userCaptcha
                        delete userData[userId].captchaAttempts
                    } else {
                        // *папытки на капче, короче вместо цикла ебучий иф который выглядит убого нахуй
                        if (userData[userId].captchaAttempts > 0) {
                            userData[userId].captchaAttempts--
                            await bot.sendMessage(chatId, `❌ Введено неправильно, осталось попыток: ❗ ${userData[userId].captchaAttempts} ❗`)
                            // *если ПРОЕБАЛСЯ, то лох ебанный
                            if (userData[userId].captchaAttempts === 0) {
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
