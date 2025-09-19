import fs from 'fs'

//создаем переменные
export const userData = {} // сам объект юзера т.е. анкета его
// !!!багфикс
let userList = []
let data = {}
try {
    // норм
    const rawData = fs.readFileSync('data.json', { encoding: 'utf8' })
    if (rawData.trim() !== "") {
        data = JSON.parse(rawData)
        userList = Object.values(data)
    } else {
        // пустышка
        userList = []
        data = {}
    }
} catch (error) {
    // хуйня
    console.log('internal DB error || creating default, code: ' + error)
    userList = []
    data = {}
}



// *шаблонная уникальная анкета для каждого юзера
function createUser (uniqueId, telegramName, userSobachka) {
    userData[userSobachka] = {
        userName: telegramName,
        userNameId: uniqueId,
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

    return userData[userSobachka]
}

// !!!!!!!!!!ОБНОВА база данных
export function updateDataJSON (entry, entryName, entrySobachka) {
    const index = userList.findIndex(user => user.userNameId === entry) // ищем конкретного юзера по айдим в массиве выше
    
    // 1 условие если пользователь существует, обнову делаем
    if (index !== -1) {
        data[entrySobachka] = userList[index]
        console.log('обнова, код операции: ' + index)
    } else {
        // если нету юзера создаем пидораса ебанного
        data[entrySobachka] = createUser(entry, entryName, entrySobachka)
        userList.push(data[entrySobachka])
        console.log('создан, пользователь не найден, код операции: ' + index)
    }

    // запись
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), { encoding: 'utf8' }) // запись
    return data[entrySobachka]
}