// токен берем с .env файла
require('dotenv').config()
const token = process.env.BOT_TOKEN

// апишка Телеграм
const TelegramApi = require('node-telegram-bot-api')

// создаем бота, делая ему параметры(токен и прочая хуйня кароче сыр залупа)
const bot = new TelegramApi(token, {polling: true})

// ID канала
CHANNEL_ID = '-1003074067217'

// тут короч темка шоб когда нажимал кнопку возле чата быстрый доступ удобно короч
bot.setMyCommands([
    {command: '/start', description: 'начало'},
    {command: '/account', description: 'мой аккаунт'},
    {command: '/balance', description: 'балик'},
    {command: '/ref', description: 'реферальная ссылка'},
    {command: '/help', description: 'список команд'},
    {command: '/cheese', description: 'показать сыры (бонусы)'}
])
console.log('bot running...')

// объект с юзерами
const userData = {} // *декларируем объект для создания анкеты юзера(все параметры)

// твоя функция генерации капчи
function captcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let captchaResult = ''
    for (let i = 0; i < 6; i++) {
        captchaResult += chars[Math.floor(Math.random() * chars.length)]
    }
    return captchaResult
}

// обнова || рефералка перенесена в отдельную функции от мусора
function referalSystem (userFrom, txt, userDb) {
    const parts = txt.split(' ')
    const refId = parts[1]
    if (refId && refId !== String(userFrom) && !userDb.invitedBy) {
        userDb.invitedBy = refId
        return true // зачисляем сыры
    }
    return false // не зачисляем пошел он нахуй уебок бля
}


// обработка сообщений (я вынес из функции старт)
bot.on('message', async msg => {
    // все шо связанное с обращением к юзеру
    const chatId = msg.chat.id
    const userId = msg.from.id
    const text = msg.text
    // *шаблонная уникальная анкета для каждого юзера
    if (!userData[userId]) {
        userData[userId] = {
            userCaptcha: undefined, 
            // уникальная капча
            captchaAttempts: 4,     
            // попытки капчи
            chancesLeft: 3,         
            // шансы (каждый шанс = 3 попытки)
            balance: 0,             
            // голда
            cheese: 0,              
            // бонусные сыры
            whitelist: false,       
            // белый список
            verifiedUsers: false,   
            // прошёл капчу
            banned: false,          
            // бан навсегда
            banUntil: undefined,    
            // таймер бана
            invitedBy: undefined,
            // кто пригласил
            getCheeseRefBonus: false
        }
    }
    // скороченая база данных
    const u = userData[userId]
    // уникальный айди для того кто кинул рефералку
    const inviterId = u.invitedBy

    // проверка вечного бана
    if (u.banned) {
        await bot.sendMessage(chatId, 'доступ закрыт навсегда, ты высрал все шансы на капче')
        return
    }

    // проверка бан-таймера
    if (u.banUntil && Date.now() < u.banUntil) {
        const mins = Math.ceil((u.banUntil - Date.now()) / 60000)
        await bot.sendMessage(chatId, `⌛ отдыхай ещё ${mins}мин и приходи по /start`)
        return
    } else if (u.banUntil && Date.now() >= u.banUntil) delete u.banUntil


    // обновил и сделал так чтобы чекало рефералов также
    if (text.startsWith('/start')) {
        // чекает рефералку
        referalSystem(userId, text, u)

        if (!u.verifiedUsers) {
            if (u.chancesLeft <= 0) {
                u.banned = true
                await bot.sendMessage(chatId, ' ты высрал все шансы, доступ закрыт навсегда')
                return
            }
            // отправляет капчу
            const sendCaptcha = captcha()
            u.userCaptcha = sendCaptcha
            await bot.sendMessage(chatId, 'шо ты лысый🧀😂, пройди проверку на бота \n\n⌨️ введи то что написано ниже и отправь:\n\n' + sendCaptcha)
            return
        }

        bot.sendMessage(chatId, 'короче тут надо будет типо запуск впн и тарифы подписки')
        return
    }

    // бля егор красава яя далбаеееб недодумался перенести так легче
    console.log(u)

    switch (text) {
        case '/account':
            await bot.sendMessage(chatId,
                `🏦 Твой личный кабинет , ${msg.from.first_name}🧀 \n\n` +
                `💳 баланс: ${u.balance} ₽\n` +
                `🧀 бонусы (сыры): 🧀${u.cheese}\n` +
                `📄 в белом списке: ${u.whitelist ? '🔒да' : '🔓 нет'}\n` +
                `🤖 проверка на бота: ${u.verifiedUsers ? '✅ пройдено' : '❌ ошибка'}`
            )
            break

        case '/balance':
            await bot.sendMessage(chatId, `💰 твой баланс: ${u.balance} ₽`)
            break

        case '/help':
            await bot.sendMessage(chatId,
                '📖 список команд:\n' +
                '/start – запуск\n' +
                '/account – мой аккаунт\n' +
                '/balance - голда на балике\n' +
                '/cheese – показать свои бонусы (сыры)\n' +
                '/ref – твоя реферальная ссылка\n' +
                '/help – помощь\n'
            )
            break

        case '/cheese':
            await bot.sendMessage(chatId, `🧀 у тебя на счету: ${u.cheese} 🧀 бонусных сыров!`)
            break

        case '/ref':
            await bot.sendMessage(chatId, 'Нажми на кнопку ниже, чтобы пригласить друга и получить бонусы🧀!:', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            // рефералка кнопка
                            {
                                text: 'Поделиться ссылкой 🧀✉️',
                                switch_inline_query: ''
                            }
                        ]
                    ]
                }
            })
            break
        default:
            // если юзер ещё не прошёл капчу и она у него есть
            if (!u.verifiedUsers && u.userCaptcha) {
                if (text === u.userCaptcha) {
                    // та самая проверка на перешел кто то по ссылке или нет, ты такое писал уже так шо должен понять шо как работает, если нет напиши сыр ебаный
                    if (inviterId && userData[inviterId] && !u.getCheeseRefBonus) {
                        userData[inviterId].cheese += 10

                        await bot.sendMessage(inviterId, `По твоей ссылке зарегестрировался новый пользователь, ты получил 10 сыра!\n` +
                        `теперь у тебя: ${userData[inviterId].cheese} единиц сыра!`)
                        u.getCheeseRefBonus = true
                    }

                    // сообщение с кнопкой "Проверить подписку"
                    await bot.sendMessage(chatId, '✅ проверка пройдена! Теперь подпишись на канал и нажми кнопку "Проверить подписку".', {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {text: 'Проверить подписку', callback_data: 'check'},
                                    {text: 'Перейти в канал', url: 'https://t.me/cheessechanel'}
                                ]
                            ]
                        }
                    }
                    )
                     // очищаем нах ненужные данные
                    u.verifiedUsers = true
                    delete u.userCaptcha
                    delete u.captchaAttempts
                    delete u.chancesLeft
                    delete u.banUntil
                    delete u.banned

                    // удаляем нахуй кнопку ту самую
                    bot.once('callback_query', async (query) => {
                        if (query.data === 'check' && query.from.id === userId) {
                            await bot.editMessageReplyMarkup(
                                {inline_keyboard: []},
                                {
                                chat_id: chatId,
                                message_id: query.message.message_id
                            }
                        )
                        }
                    })
                } else {
                    if (u.captchaAttempts > 0) {
                        u.captchaAttempts--
                        await bot.sendMessage(chatId, `введено неправильно, осталось попыток: ❗ ${u.captchaAttempts} ❗`)

                        if (u.captchaAttempts === 0) {
                            u.chancesLeft--
                            if (u.chancesLeft <= 0) {
                                u.banned = true
                                await bot.sendMessage(chatId, ' ты высрал все шансы (3 из 3), доступ закрыт навсегда ')
                                return
                            }
                            u.banUntil = Date.now() + 2 * 60 * 1000
                            u.captchaAttempts = 4
                            delete u.userCaptcha
                            await bot.sendMessage(chatId, `ты проебал 3 попытки. осталось шансов: ${u.chancesLeft}. жди 2 мин и приходи снова по /start`)
                            return
                        }
                    }
                }
            }
    }
})
// 
bot.on('callback_query', async (query) => {      
    const cbUserId = query.from.id
    const data = query.data
    const u = userData[cbUserId]
    if (!u || (!u.verifiedUsers && data !== 'check')) return 
    if (data === 'check') {
        const requestMember = await bot.getChatMember(CHANNEL_ID, cbUserId)
        if(['member', 'administrator', 'creator'].includes(requestMember.status)) {
            await bot.sendMessage(cbUserId, '✅ Вы подписаны на канал, вы получили 5 сыров!')
            u.cheese += 5
        } else {
            await bot.sendMessage(cbUserId, '❌ Вы не подписаны на канал, вы не получили бонусы😭')
        }
    }
})

// поделиться через кнопку
bot.on('inline_query', async (query) => {
    const referalLink = `https://t.me/orangeCheesyBot?start=${query.from.id}`
    const messageRequest = `Привет! Используй бота вместе со мной! Присоеденяйся: ${referalLink}`
    const results = [
        {
            type: 'article',
            id: 'share_ref',
            title: '✉️Поделиться сырным ботом🧀',
            input_message_content: {
                message_text: messageRequest
            }
        }
    ]
    bot.answerInlineQuery(query.id, results)
})

// обработка ошибок
bot.on('polling_error', console.error)
