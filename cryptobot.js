import 'dotenv/config'
import pkg from 'crypto-bot-api'
import express from 'express'
import { bot } from './index.js'
import { userData } from './database.js'

const CryptoPay = pkg.default || pkg
const app = express()

export const crypto = new CryptoPay(process.env.CRYPTO_BOT_API_TOKEN)

app.use(express.json())

app.post('/crypto/webhook', (req, res) => {
    const update = req.body
    console.log('Вебхук от криптобота: ', update)

    if (update.update_type === 'invoice_paid') {
        const invoiceId = update.invoice.invoice_id

        const cryptoUserId = Object.keys(userData).find(
            uid => userData[uid].cryptoId === invoiceId
        )
        if (cryptoUserId) {
            userData[cryptoUserId].balance += 1
            bot.sendMessage(cryptoUserId, '✅ *Оплата успешна! Доступ к VPN активирован*', {
                parse_mode: 'Markdown'
            })
        }
    }

    res.sendStatus(200)
})

app.listen(3000, (req, res) => {
    console.log('Server started...')
})