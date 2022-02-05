(async () => {
     switch(true) {
         case /^(stic?kerline)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/stickerline', { query: text }, 'apikey'))
             let txt = api.map(({ title, authorName, url }) => {
                 return `*${title}*\n_${authorName}_\n_${url}_`
             }).join`\n\n`
             conn.sendFile(from, api[0].sticker, '', txt, m)
             break
         }
         case /^google$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/google', { query: text }, 'apikey'))
             let url = 'https://google.com/search?q=' + encodeURIComponent(text)
             let txt = api.articles.map(({ title, description, url }) => {
                 return `*${title}*\n_${url}_\n_${description}_`
             }).join`\n\n`
             conn.reply(from, url + '\n\n' + txt, m)
             break
         }
         case /^gimage$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/gimage', { query: text }, 'apikey'))
             let url = pickRandom(api)
             conn.sendFile(from, url, '', '*Google Image*: ' + text, m)
             break
         }
         case /^(pinterest)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/pinterest', { query: text }, 'apikey'))
             let url = pickRandom(api.result)
             conn.sendFile(from, url, '', '*Hasil pencarian dari*: ' + text, m)
             break
         }
         case /^(konachan)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             conn.sendFile(from, API('zaki', '/konachan', { query: text }, 'apikey'), '', '', m)
             break
         }
         case /^(stic?kerpack)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/sticker', { query: text }, 'apikey'))
             let txt = api.result.map(({ title, url }) => {
                 return `*${title}*\n_${url}_`
             }).join`\n\n`
             conn.reply(from, txt, m)
             break
         }
         case /^(happymod)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/happymod', { query: text }, 'apikey'))
             let txt = api.result.map(({ title, link, rating }) => {
                 return `*${title}*\n_${rating}_\n_${link}_`
             }).join`\n\n`
             conn.sendFile(from, api.result[0].icon, '', txt, m)
             break
         }
         case /^(sfilemobi)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/sfilesearch', { query: text, page: '1' }, 'apikey'))
             let txt = api.result.map(({ title, size, link }) => {
                 return `*${title}*\n_${size}_\n_${link}_`
             }).join`\n\n`
             conn.reply(from, txt, m)
             break
         }
         case /^(alphacoders)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             conn.sendFile(from, API('zaki', '/alphacoders', { query: text }, 'apikey'), '', '', m)
             break
         }
         case /^(wallpaper|wp)cave$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             conn.sendFile(from, API('zaki', '/wallpapercave', { query: text }, 'apikey'), '', '', m)
             break
         }
         case /^(stelesearch)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/stelesearch', { query: text }, 'apikey'))
             let txt = api.map(({ title, link }) => {
                 return `*${title}*\n_${link}_`
             }).join`\n\n`
             conn.sendFile(from, api[0].icon, '', txt, m)
             break
         }
         case /^yts(earch)?$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/ytsearch', { query: text }, 'apikey'))
             let txt = api.video.map(({ title, description, durationH, viewH, type, authorName, publishedTime, url }) => {
                 return `*${title}*\nAuthor: ${authorName}\nType: ${type}\nView: ${viewH}\nDuration: ${durationH}\nPublished: ${publishedTime}\n_${url}_`
             }).join`\n\n`
             reply(txt.trim(), from, { contextInfo: { externalAdReply: { title: api.video[0].title, body: api.video[0].description, mediaType: 2, thumbnailUrl: api.video[0].thumbnail, mediaUrl: api.video[0].url }}})
             break
         }
         case /^wiki(pedia)$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/wikipedia', { query: text }, 'apikey'))
             reply(api.articles)
             break
         }
         case /^domain$/i.test(command): {
             if (!text) return reply('Query needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/domainsearch', { query: text }, 'apikey'))
             let txt = api.result.map(({ domain, price }) => {
                 return `*${domain}*\n_${price}_`
             }).join`\n\n`
             conn.reply(from, txt, m)
             break
         }
     }
})()
