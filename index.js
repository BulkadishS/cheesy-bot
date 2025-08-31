import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
dotenv.config()

const CHANNEL_ID = '-1003074067217'
const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, {polling: true})

bot.setMyCommands([
    {command: '/start', description: 'начало'},
    {command: '/account', description: 'мой аккаунт'},
    {command: '/ref', description: 'реферальная ссылка'},
    {command: '/help', description: 'список команд'},
    {command: '/cheese', description: 'показать сыры (бонусы)'}
])
console.log('bot running...')

// функции
const userData = {} // *декларируем объект для создания анкеты юзера(все параметры)
function createUser (userId) {
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
    return userData[userId]
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



// обработка сообщений
bot.on('message', async msg => {
    // все шо связанное с обращением к юзеру
    const chatId = msg.chat.id
    const userId = msg.from.id
    const text = msg.text

    // обнова, перенес в функцию так как не работает в callback_query функция где проверяет рефералки и всякая хуйня
    const u = createUser(userId)

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


    // обновил и сделал так чтобы чекало рефералов также
    if (text.startsWith('/start')) {
        // чекает рефералку
        referalSystem(userId, text, u)
        if (!u.verifiedUsers) {
            if (u.chancesLeft <= 0) {
                u.banned = true
                await bot.sendMessage(chatId, '🚫 Доступ закрыт навсегда!\n\nВы исчерпали все свои шансы. Если думаете, что это ошибка, свяжитесь с администратором. 🧀')
                return
            }
            // отправляет капчу
            const sendCaptcha = captcha()
            u.userCaptcha = sendCaptcha
            await bot.sendMessage(chatId, 
`🧀 Привет, ${msg.from.first_name}!  

🚀 Перед началом работы нужно убедиться, что ты не бот.  

⌨️ Введи точно то, что написано ниже и отправь:\n\n` + sendCaptcha, 
{ parse_mode: 'Markdown' }
)            
            return
        }

        await bot.sendMessage(chatId, '📡 Добро пожаловать в наш VPN-сервис! \n\nВыберите подходящий тариф:', {
            reply_markup: {
                inline_keyboard: [
                    [{text: ' ' }]
                ]
            }}
        )
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
        default:
            // если юзер ещё не прошёл капчу и она у него есть
            if (!u.verifiedUsers && u.userCaptcha) {
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
    }
})


bot.on('callback_query', async (query) => {      
    const cbUserId = query.from.id
    const data = query.data
    const u = createUser(cbUserId)
    const inviterId = userData[cbUserId].invitedBy
    // локальный айди сообщения
    const localMessageId = query.message.message_id
    if (!u || (!u.verifiedUsers && data !== 'check')) return
    try {
        if (data === 'check') {
            // переменные проверка на подписку

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
        }

        await bot.answerCallbackQuery(query.id)
    } catch(err) {
        console.log('ошибка при проверке полписки', err)
    }
})

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
