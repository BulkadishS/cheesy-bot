// вместо require() в сто раз нахуй удобнее
import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
// тут щя подробно короче из файла cryptobot.js высовываем КОНСТ который отвечает за оплату и всю залупу в общем, там как new вот та залупа как тут с телегой, если не понял пиши сыр
import { crypto } from './cryptobot.js'
import fs from 'fs'
dotenv.config()

const CHANNEL_ID = '-1003074067217'
const token = process.env.BOT_TOKEN
export const bot = new TelegramBot(token, {polling: true})

bot.setMyCommands([
    {command: '/start', description: 'начало'},
    {command: '/account', description: 'мой аккаунт'},
    {command: '/ref', description: 'реферальная ссылка'},
    {command: '/help', description: 'список команд'},
    {command: '/cheese', description: 'показать сыры (бонусы)'}
])
console.log('bot running...')

// функции
export const userData = { id: {} } // *декларируем объект для создания анкеты юзера(все параметры)
const userList = []
export function createUser (userId, chatUserId, telegramName, userSobachka) {
    // *шаблонная уникальная анкета для каждого юзера
    if (!userData[userId]) {
        userData[userId] = {
            [chatUserId]: {
                userName: telegramName,
                userUser: userSobachka,
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
                // проверяем проверил ли он подписку
                waitingForButtonPress: true,
                // прошёл капчу
                banned: false,          
                // бан навсегда
                banUntil: undefined,    
                // таймер бана
                invitedBy: undefined,
                // кто пригласил
                getCheeseRefBonus: false,
                // крипто платежи !!!!!!!!!!!!!НОВОЕ!!!!!!!!!!!!!!
                cryptoId : undefined
            }
        }
    }
    return userData[userId][chatUserId]
}

function captcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let captchaResult = ''
    for (let i = 0; i < 6; i++) {
        captchaResult += chars[Math.floor(Math.random() * chars.length)]
    }
    return captchaResult
}

function referalSystem (userFrom, txt, userDb) {
    const parts = txt.split(' ')
    const refId = parts[1]
    if (refId && refId !== String(userFrom) && !userDb.invitedBy) {
        userDb.invitedBy = refId
        return true // зачисляем сыры
    }
    return false // не зачисляем пошел он нахуй уебок бля
}

// !!!!!!!!!!ОБНОВА база данных
function updateDataJSON (entry, entryId) {
    const loadUser = createUser(entry, entryId) // создаем базу данних
    userList.push(loadUser) // добавляем в условный массив(объясню)
    const rawData = fs.readFileSync('data.json', { encoding: 'utf8' }) // читаем дату
    const data = JSON.parse(rawData) // перекидываем в дату

    const index = userList.findIndex(user => user.entryId === entry.id)
    if (index !== -1) {
        data[entry] = loadUser // перезаписываем далбаеба
    } else {
        data[entry] = userList.push(loadUser) // добавляем далбаеба
    }

    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), { encoding: 'utf8', flag: 'w' }) // запись
    console.log(data)
}

// const adminId = 6336954115 // !!!!!!!!!!!!!!!!!!!!!!! тестовый админ меню
// userData[adminId] = {
//     balance: 0,
//     cheese: 0,
//     verifiedUsers: true,
//     cryptoId: 'admin_crypto_id'
// }



// обработка сообщений
bot.on('message', async msg => {
    // все шо связанное с обращением к юзеру
    const chatId = msg.chat.id
    const userId = msg.from.id
    const text = msg.text
    const userFirstName = msg.from.first_name

    // обнова, добавление юзердаты в базуданных
    const u = createUser(userId, userId, userFirstName, msg.from.username)
    updateDataJSON(userId, userId)
    
    // проверка на бан включая временный и пермач
    if (u.banned) {
        await bot.sendMessage(chatId, '❌ Упс! Доступ закрыт навсегда.\nВы не прошли проверку на бота. 🧀')
        return
    }
    if (u.banUntil && Date.now() < u.banUntil) {
        const mins = Math.ceil((u.banUntil - Date.now()) / 60000)
        await bot.sendMessage(chatId, `⌛ Осталось ${mins} мин до следующей попытки. Попробуй снова командой /start 🧀`, { parse_mode: 'Markdown' });
        return
    } else if (u.banUntil && Date.now() >= u.banUntil) delete u.banUntil


    // капча
    if (typeof text === 'string' && text.startsWith('/start')) {
        referalSystem(userId, text, u)
        if (!u.verifiedUsers) {
            if (u.chancesLeft <= 0) {
                u.banned = true
                await bot.sendMessage(chatId, '🚫 Доступ закрыт навсегда!\n\nВы исчерпали все свои шансы. Если думаете, что это ошибка, свяжитесь с администратором. 🧀')
                return
            }

            const sendCaptcha = captcha()
            u.userCaptcha = sendCaptcha

            await bot.sendMessage(chatId, 
            `🧀 Привет, ${userFirstName}!  

    🚀 Перед началом работы нужно убедиться, что ты не бот.  

    ⌨️ Введи точно то, что написано ниже и отправь:\n\n` + sendCaptcha, 
        { parse_mode: 'Markdown' }
        )            
            return
        }

        await bot.sendMessage(chatId, '📡 Добро пожаловать в наш VPN-сервис! \n\nВыберите подходящий тариф:', {
            reply_markup: {
                inline_keyboard: [
                    [{text: '1 Неделя - 0₽', callback_data: 'buy_week' }],
                    [{text: '1 Месяц - 150₽', callback_data: 'buy_month'}],
                    [{text: '3 Месяца - 300₽', callback_data: 'buy_three_month'}]
                ]
            }}
        )
        return
    }
    
    if (!u.verifiedUsers && u.userCaptcha) {
        if (text.startsWith('/') && text !== '/start') {
            await bot.sendMessage(chatId, '🚫 *Сначала введите капчу, чтобы использовать команды*', {
                parse_mode: 'Markdown'
            })
            return
        }

        if (text === u.userCaptcha) {
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
            u.verifiedUsers = true
            delete u.userCaptcha
            delete u.captchaAttempts
            delete u.chancesLeft
            delete u.banUntil
            delete u.banned
        } else {
            if (u.captchaAttempts > 0) {
                u.captchaAttempts--
                await bot.sendMessage(chatId, `введено неправильно, осталось попыток: ❗ ${u.captchaAttempts} ❗`)

                if (u.captchaAttempts === 0) {
                    u.chancesLeft--
                    if (u.chancesLeft <= 0) {
                        u.banned = true
                        await bot.sendMessage(chatId, '❌ Ты исчерпал все шансы (3 из 3).\n🚫 Доступ к боту закрыт навсегда.')
                        return
                    }
                    u.banUntil = Date.now() + 2 * 60 * 1000
                    u.captchaAttempts = 4
                    delete u.userCaptcha
                    await bot.sendMessage(chatId, `⚠️ Ты исчерпал 3 попытки.\nОсталось шансов: ${u.chancesLeft}.\n⏳ Подожди 2 минуты и попробуй снова командой /start.`)
                    return
                }
            }
        }
    }
    ///////////////////////////////////////////

    // console.log(u)
    // пока в u.userCaptcha что то есть, не выполнять условие ниже

    switch (text) {
        case '/account':
            await bot.sendMessage(chatId,
                `🏦 Твой личный кабинет , ${userFirstName}🧀 \n\n` +
                `💳 баланс: ${u.balance} ₽\n` +
                `🧀 бонусы (сыры): 🧀${u.cheese}\n` +
                `📄 в белом списке: ${u.whitelist ? '🔒да' : '🔓 нет'}`
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
                '/ref – твоя реферальная ссылка\n' +
                '/cheese – показать свои бонусы (сыры)\n' +
                '/help – помощь'
            )
            break

        case '/cheese':
            const cheeseBonusCheckMSG = `🧀 Твои бонусные сыры: ${u.cheese} 
            Хотите заработать больше сыра? 🤑  
            Выполняйте задания и приглашайте друзей! 👇  

            Используй команду /ref чтобы пригласить друзей и получать бонусы ✉️
            Выполняй другие задания, чтобы увеличить свой баланс сыра 🧀`

            await bot.sendMessage(chatId, cheeseBonusCheckMSG, { parse_mode: 'Markdown' })
            break

        case '/ref':
            await bot.sendMessage(chatId, '🎁 Пригласи друга и получи 10 бонусных сыров 🧀!\nНажми на кнопку ниже, чтобы поделиться ссылкой:', {
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
    }
})


bot.on('callback_query', async (query) => {      
    const cbUserId = query.from.id
    const data = query.data
    const u = createUser(cbUserId, cbUserId)
    const inviterId = u.invitedBy
    // локальный айди сообщения
    const localMessageId = query.message.message_id
    if (!u || (!u.verifiedUsers && data !== 'check')) return
    try {

        // !!!!!!!!!!!!! НОВОЕ !!!!!!!!!!!!!

        switch (data) {
            // ОПЛАТА ВПН, ВСЕ ЧТО БУДЕТ С КОШЕЛЬКАМИ СВЯЗАНО
            
            // НА НЕДЕЛЮ
            case 'buy_week':
                await bot.editMessageText('\n💸 *Выберите способ оплаты*:\n', {
                    chat_id: cbUserId,
                    message_id: localMessageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            // КРИПТА
                            [{text: '🪙 Криптовалюта (Cryptobot Telegram)', callback_data: 'cryptobot_pay_week'}]
                        ]
                    }
                })
                break

            case 'cryptobot_pay_week':
                const weekCryptoInvoice = await crypto.createInvoice({
                    asset: 'USDT',
                    amount: 1,
                    description: '📡 Покупка VPN на 7 дней'
                })
                // пей линк
                const weekCryptoPayLink = weekCryptoInvoice.BotPayUrl || weekCryptoInvoice.miniAppPayUrl || weekCryptoInvoice.webAppPayUrl
                // записываем инвойс
                u.cryptoId = weekCryptoInvoice.invoice_id
                await bot.sendMessage(cbUserId,
                    `📋 *Оплата VPN на 7 дней:*\n\n` +
                    `👇 Пожалуйста, перейдите по ссылке, чтобы оплатить:\n` +
                    `${weekCryptoPayLink}`,
                    {
                        parse_mode: 'Markdown',
                    }
                )
                break



            case 'buy_month':
                await bot.editMessageText('\n💸 *Выберите способ оплаты*:\n', {
                    chat_id: cbUserId,
                    message_id: localMessageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            // КРИПТА
                            [{text: '🪙 Криптовалюта (Cryptobot Telegram)', callback_data: 'cryptobot_pay_month'}]
                        ]
                    }
                })
                break

            case 'cryptobot_pay_month':
                const monthCryptoinvoice = await crypto.createInvoice({
                    asset: 'USDT',
                    amount: 1,
                    description: '📡 Покупка VPN на месяц'
                })
                // пей линк
                const monthCryptoPayLink = monthCryptoinvoice.BotPayUrl || monthCryptoinvoice.miniAppPayUrl || monthCryptoinvoice.webAppPayUrl
                // записываем инвойс
                u.cryptoId = monthCryptoinvoice.invoice_id

                await bot.sendMessage(cbUserId,
                    `📋 *Оплата VPN на месяц:*\n\n` +
                    `👇 Пожалуйста, перейдите по ссылке, чтобы оплатить:\n` +
                    `${monthCryptoPayLink}`,
                    {
                        parse_mode: 'Markdown',
                    }
                )
                break


            case 'buy_three_month':
                await bot.editMessageText('\n💸 *Выберите способ оплаты*:\n', {
                    chat_id: cbUserId,
                    message_id: localMessageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            // КРИПТА
                            [{text: '🪙 Криптовалюта (Cryptobot Telegram)', callback_data: 'cryptobot_pay_three_month'}]
                        ]
                    }
                })
                break

            case 'cryptobot_pay_three_month':
                const threeMonthCryptoinvoice = await crypto.createInvoice({
                    asset: 'USDT',
                    amount: 1,
                    description: '📡 Покупка VPN на 3 месяца'
                })
                // пей линк
                const threeMonthCryptoPayLink = threeMonthCryptoinvoice.BotPayUrl || threeMonthCryptoinvoice.miniAppPayUrl || threeMCryptoinvoice.webAppPayUrl
                // записываем инвойс
                u.cryptoId = threeMonthCryptoinvoice.invoice_id

                await bot.sendMessage(cbUserId,
                    `📋 *Оплата VPN на 3 месяца:*\n\n` +
                    `👇 Пожалуйста, перейдите по ссылке, чтобы оплатить:\n` +
                    `${threeMonthCryptoPayLink}`,
                    {
                        parse_mode: 'Markdown',
                    }
                )
                break

            // ПРОВЕРКА НА ПОДПИСКУ (КНОПКА) (ПЕРЕНЕС ТАК КАК ОПТИМИЗАЦИЯ КОРОЧЕ ХУЙ ТАМ ПЛАВАЛ)
            case 'check':
                u.waitingForButtonPress = false
                const requestMember = await bot.getChatMember(CHANNEL_ID, cbUserId)
                const subscribed = ['member', 'administrator', 'creator'].includes(requestMember.status)

                // проверка на подписку канала и начисление бонус за это
                if(subscribed) {            
                    u.cheese += 5
                    // проверка на рефералку
                    if (inviterId && userData[inviterId] && !u.getCheeseRefBonus) {
                        userData[inviterId].cheese += 10
                        u.getCheeseRefBonus = true
                        await bot.sendMessage(u.invitedBy, `🎉 По твоей ссылке зарегистрировался и подписался новый пользователь!\nТы получил +10 🧀!
                        👉 Теперь ты можешь посмотреть сколько у тебя сейчас сыров /cheese`)
                    }
                    await bot.editMessageText(
                        '🎉 **Поздравляем!**\n\n✅ Вы подписаны и получили **+5 🧀**! Можете теперь пользоваться нашими услугами по команде /start',
                        {
                            chat_id: cbUserId, 
                            message_id: localMessageId, 
                            parse_mode: 'Markdown',
                            reply_markup: { inline_keyboard: []}
                        }
                    )
                } else {
                    await bot.editMessageText(
                        '❌ Вы ещё **не подписаны**.\n\nПодпишитесь и нажмите «Проверить подписку» снова, чтобы получить **+5 🧀**!',
                        {
                            chat_id: cbUserId,
                            message_id: localMessageId,
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    {text: '🔄 Проверить подписку', callback_data: 'check'},
                                    {text: '➡️ Перейти в канал', url: 'https://t.me/cheessechanel'}
                                ]]
                            }
                        }
                    )
                }

                break
        }

        await bot.answerCallbackQuery(query.id)
    } catch(err) {
        console.log('ошибка в колбеке оплаты и проверки подписки ', err)
    }
})


// !!!!!!!!!!!! ДАЛЬШЕ НЕ ДЕЛАЛ !!!!!!!!!!!!!!!!!!!!



// поделиться через кнопку
bot.on('inline_query', async (query) => {
    const referalLink = `https://t.me/orangeCheesyBot?start=${query.from.id}`
    const messageRequest = `*Привет!* 👋
    Используй *сырный VPN* 🧀 вместе со мной и получай безопасный и быстрый доступ к интернету.
    Пройди проверку на бота и подпишись чтобы ты и твой друг получили *бонусов* 😉

    🎁 *Бесплатные услуги* уже ждут тебя!

    Подключайся прямо сейчас: [Нажми здесь](${referalLink})`

    const results = [
        {
            type: 'article',
            id: 'share_ref',
            title: '✉️ Поделиться сырным VPN ботом',
            description: 'Бесплатный доступ к VPN для друзей на неделю!',
            input_message_content: {
                message_text: messageRequest,
                parse_mode: 'Markdown'
            }
        }
    ]
    bot.answerInlineQuery(query.id, results)
})

// обработка ошибок
// bot.on('polling_error', console.error)