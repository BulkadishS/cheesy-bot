import { userData } from "./database.js"
import { crypto } from './cryptobot.js'
import { updateDataJSON } from "./database.js"
import { shopList } from "./index.js"
import { backButton } from "./index.js"
// мейби еще импортнуть setBackButton но хз если надо будет
const CHANNEL_ID = '-1003074067217'




export default function callbackHandler (bot) {
    
    async function backHandler (presserId, replaceMsgId) {
        await bot.editMessageText('📡 Добро пожаловать в наш VPN-сервис! \n\nВыберите подходящий тариф:', 
            {
                chat_id: presserId,
                message_id: replaceMsgId,
                parse_mode: 'markdown',
                reply_markup: {
                    inline_keyboard: shopList
                }
            }
        )
    }

    bot.on('callback_query', async (query) => {      
        const cbUserId = query.from.id
        const data = query.data
        const u = updateDataJSON(cbUserId, undefined, `${query.from.username}_Payment`) // закидываем в базу данных платежный профиль пользователя(имба нахуй ПАААА)
        const inviterId = u.invitedBy
        const localMessageId = query.message.message_id
        if (!u || (!u.verifiedUsers && data !== 'check')) return
        try {
            switch (data) {
                // НА НЕДЕЛЮ
                case 'buy_week':
                    console.error('!WORKING, SUCCESS!')
                    await bot.editMessageText('\n💸 *Выберите способ оплаты*:\n', {
                        chat_id: cbUserId,
                        message_id: localMessageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                // КРИПТА
                                [{text: '🪙 Криптовалюта (Cryptobot Telegram)', callback_data: 'cryptobot_pay_week'}],
                                backButton
                            ]
                        }
                    })
                    break

                case 'buy_month':
                    await bot.editMessageText('\n💸 *Выберите способ оплаты*:\n', {
                        chat_id: cbUserId,
                        message_id: localMessageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                // КРИПТА
                                [{text: '🪙 Криптовалюта (Cryptobot Telegram)', callback_data: 'cryptobot_pay_month'}],
                                backButton
                            ]
                        }
                    })
                    break

                case 'buy_three_month':
                    await bot.editMessageText('\n💸 *Выберите способ оплаты*:\n', {
                        chat_id: cbUserId,
                        message_id: localMessageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                // КРИПТА
                                [{text: '🪙 Криптовалюта (Cryptobot Telegram)', callback_data: 'cryptobot_pay_three_month'}],
                                backButton
                            ]
                        }
                    })
                    break
                
                // КРИПТА

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
                    delete u.waitingForButtonPress
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
                
                case 'back':
                    backHandler(cbUserId, localMessageId)
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
}
