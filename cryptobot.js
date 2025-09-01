import 'dotenv/config'
import pkg from 'crypto-bot-api'

const CryptoPay = pkg.default || pkg
export const crypto = new CryptoPay(process.env.CRYPTO_BOT_API_TOKEN)