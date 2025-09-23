// сука щас внимательно читай
// шоб каждый раз не перезапускать и по сто раз не писать "node index.js", я добавил хуйнюшку, которая упрощает жизнь
// в 100 раз
// с этого момента
// !!!!!!!!!! ДЛЯ ЗАПУСКА КОДА ПИШИ   npm start   в консоль !!!!!!!!!!!!!!!!!!!!!

import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { updateDataJSON } from './database.js'
import callbackHandler from './callback.js'

dotenv.config()

const token = process.env.BOT_TOKEN
export const bot = new TelegramBot(token, {polling: true})
callbackHandler(bot)

bot.setMyCommands([
    {command: '/start', description: 'начало'},
    {command: '/account', description: 'мой аккаунт'},
    {command: '/ref', description: 'реферальная ссылка'},
    {command: '/help', description: 'список команд'},
    {command: '/cheese', description: 'показать сыры (бонусы)'}
])
console.log('bot running...')

// функции / переменные

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


// шаблон типо, на кнопке назад чтобы вернуться назад не получиться проста так, и шобы не писать вот короче шаблон понял
export const shopList = [
    [{text: '1 Неделя - 0₽', callback_data: 'buy_week' }],
    [{text: '1 Месяц - 150₽', callback_data: 'buy_month'}],
    [{text: '3 Месяца - 300₽', callback_data: 'buy_three_month'}]
]

// вставить в кнопку
// эта шобы установить им всем reply markup, шобы не писать каждый раз в параметрах bot.sendMessage/editMessageText
export const backButton = [{text: '◀️ Назад', callback_data: 'back'}]

// создать кнопку
// эта короче хуйня типо когда нету ваще никаких кнопок у сообщения которое бот кидает, он создает кнопку
const setBackButton = {
    reply_markup: {
        inline_keyboard: [backButton]
    }
}

// ето пиздатая тема нахуй, шобы по сто раз не писать везде в этом свитче ифах нахуй, просто функцию вызвать ну ахуенно же

// !раскомент если дебагать!

// const adminId = 6336954115 // !!!!!!!!!!!!!!!!!!!!!!! тестовый админ меню
// userData[adminId] = {
//     balance: 0,
//     cheese: 0,
//     verifiedUsers: true,
//     cryptoId: 'admin_crypto_id'
// }

// !раскомент если дебагать!


// обработка сообщений
bot.on('message', async msg => {
    // все шо связанное с обращением к юзеру
    const chatId = msg.chat.id
    const userId = msg.from.id
    const text = msg.text
    const userFirstName = msg.from.first_name // имя в телеге

    // красиво когда удаляет
    bot.deleteMessage(chatId, msg.message_id)

    // глобальная обнова, написал в прошлых комитах
    const u = updateDataJSON(userId, userFirstName, msg.from.username)
    console.log(msg.from.username, userFirstName, userId)

    // проверка на бан + пермач
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
        
        await bot.sendMessage(userId, '📡 Добро пожаловать в наш VPN-сервис! \n\nВыберите подходящий тариф:', {
            reply_markup: {
                inline_keyboard: shopList
            }
        })

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

// свитч

    switch (text) {
        case '/account':
            await bot.sendMessage(chatId,
                `🏦 Твой личный кабинет , ${userFirstName}🧀 \n\n` +
                `💳 баланс: ${u.balance} ₽\n` +
                `🧀 бонусы (сыры): 🧀${u.cheese}\n` +
                `📄 в белом списке: ${u.whitelist ? '🔒да' : '🔓 нет'}`,
            setBackButton
            )
            break

        case '/help':
            await bot.sendMessage(chatId,
                '📖 список команд:\n' +
                '/start – запуск\n' +
                '/account – мой аккаунт\n' +
                '/ref – твоя реферальная ссылка\n' +
                '/cheese – показать свои бонусы (сыры)\n' +
                '/help – помощь',
            setBackButton
            )
            break

        case '/cheese':
            const cheeseBonusCheckMSG = `🧀 Твои бонусные сыры: ${u.cheese} 
            Хотите заработать больше сыра? 🤑  
            Выполняйте задания и приглашайте друзей! 👇  

            Используй команду /ref чтобы пригласить друзей и получать бонусы ✉️
            Выполняй другие задания, чтобы увеличить свой баланс сыра 🧀`

            await bot.sendMessage(chatId, cheeseBonusCheckMSG, setBackButton)
            break

        case '/ref':
            await bot.sendMessage(chatId, '🎁 Пригласи друга и получи 10 бонусных сыров 🧀!\nНажми на кнопку ниже, чтобы поделиться ссылкой:', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'Поделиться ссылкой 🧀✉️',switch_inline_query: ''}],
                        backButton
                    ]
                }
            })
            break
    }
})

// калбек на кнопках


// обработка ошибок
// bot.on('polling_error', console.error)