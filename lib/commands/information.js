(async () => {
     switch(true) {
         case /^check(apikey)$/i.test(command): {
             if (!text) return reply('Apikey needed.')
             let api = await functions.fetchJson(API('zaki', '/checkapikey', { apikey: text }))
             let txt = '*Check your key*\n\n'
             txt += '*Username*: ' + api.result.username + '\n'
             txt += '*Request*: ' + api.result.request + '\n'
             txt += '*Email*: ' + api.result.email + '\n'
             txt += '*Limit*: ' + api.result.limit
             conn.reply(from, txt, m)
             break
         }
     }
})()