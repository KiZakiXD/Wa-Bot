(async () => {
     switch(true) {
         case /^(menu|help)$/i.test(command): {
             let prep = await conn.toMSG(global.thumb, 'imageMessage')
             conn.sendMessage(from, { contentText: menu(m, body, pushname).trim(), footerText: '© api.kizakixd.xyz', buttons: [{ buttonId: `${prefix}owner`, buttonText: { displayText: 'Owner' }, type: 1 },{ buttonId: `${prefix}tos`, buttonText: { displayText: 'Cara Penggunaan' }, type: 1 }], headerType: 'IMAGE', imageMessage: prep }, 'buttonsMessage', { quoted: m })
             break
         }
         case /^tos$/i.test(command): {
             reply(penggunaan())
             break
         }
         case /^(get|fetch)$/i.test(command): {
             if (!text) return reply('URL needed.')
             let res = await fetch(args[0])
             if (res.headers.get('content-length') > 100 * 1024 * 1024 * 1024) {
                 delete res.headers
                 reply(`Content-Length: ${res.headers.get('content-length')}`)
             } 
             if (!/text|json/.test(res.headers.get('content-type'))) return conn.sendFile(from, text, 'file', text, m)
             let txt = await res.buffer()
             try {
                txt = util.format(JSON.parse(txt + ''))
             } catch (e) {
                txt = txt + ''
             } finally {
                reply(txt.slice(0, 65536) + '')
             }
             break
         }
         case /^owner$/i.test(command): {
             let listOwner = new Array()
             for (let i of global.ownerNumber.map(v => v.replace(/\D/g, '') + '@s.whatsapp.net')) {
                 listOwner.push({ vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;;;;\nFN:${conn.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Home\nitem2.URL:https://kizakixd.xyz\nitem2.X-ABLabel:キザキクド\nitem3.X-ABLabel:キザキクド\nEND:VCARD` })
             }
             conn.sendMessage(from, { displayName: listOwner.length + ' kontak', contacts: listOwner }, 'contactsArrayMessage', { quoted: m })
             break
         }
         case /^cekprefix$/i.test(body): {
             reply('Prefix: ' + prefix)
             break
         }
         case /^del(ete)?$/i.test(command): {
             if (quoted && quoted.fromMe) {
                  await quoted.delete()
             } else reply('Reply to messages from bot!')
             break
         }
         case /^(up|run)time$/i.test(command): {
             reply(functions.clockString(process.uptime()))
             break
         }
         case /^(ping|speed)$/i.test(command): {
             let old = +new Date
             await reply('_Testing speed..._')
             let neww = +new Date
             let speed = functions.parseMs(neww - old)
             reply(`Merespon dalam ${speed.seconds}.${speed.milliseconds} detik`)
             break
         }
         case /^(list(grup|group|gc)|grouplist)$/i.test(command): {
             let txt = conn.chats.all().filter(v => v.jid.endsWith('g.us')).map(v =>`${v.name}\n${v.jid} [${v.read_only ? 'Left' : 'Joined'}]`).join`\n\n`
             reply('List Groups:\n' + txt)
             break
         }
         case /^r(vo|eadviewonce)$/i.test(command): {
             if (!m.quoted) return reply('Reply viewOnce message!')
             if (m.quoted.mtype !== 'viewOnceMessage') return reply('Thats not a viewOnce message')
             await conn.copyNForward(from, await conn.loadMessage(from, m.quoted.id), false, { readViewOnce: true }).catch(_ => reply('Maybe its been opened by a bot'))
             break
         }
         case /^ppcouple$/i.test(command): {
             let api = await functions.fetchJson(API('zaki', '/ppcouple', {}, 'apikey'))
             await reply(mess.wait)
             await conn.sendFile(from, api.result.male, '', 'Male', m)
             await conn.sendFile(from, api.result.female, '', 'Female', m)
             break
         }
         case /^quotes$/i.test(command): {
             let api = await functions.fetchJson(API('zaki', '/quotes', {}, 'apikey'))
             let txt = '*Author*: ' + api.author + '\n'
             txt += '*Quotes*: ' + api.quotes
             conn.reply(from, txt, m)
             break
         }
         case /^quotesanime$/i.test(command): {
             let api = await functions.fetchJson(API('zaki', '/quotesanime', {}, 'apikey'))
             let txt = '*Character*: ' + api.character + '\n'
             txt += '*Anime*: ' + api.anime + '\n'
             txt += '*Episode*: ' + api.episode + '\n'
             txt += '*Quotes*: ' + api.quote
             conn.reply(from, txt, m)
             break
         }
     }
})()
