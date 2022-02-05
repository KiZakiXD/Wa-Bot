(async () => {
     switch(true) {
         case /^(ig(dl)?)$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             try {
                let api = await functions.fetchJson(API('zaki', '/igdl', { url: args[0] }, 'apikey'))
                await reply(mess.wait)
                if (api.result.uriType === "igHigh") {
                     conn.sendFile(from, api.result.media[0].url, '', '', m)
                } else if (api.result.uriType === "igStory") {
                     conn.sendFile(from, api.result.media[0].url, '', '', m)
                } else {
                     api.result.url.map((r) => {
                         conn.sendFile(from, r, '', '', m)
                     })
                }
             } catch {
                 reply('Failed to download instagram media from the given link.')
             }
             break
         }
         case /^(pindl)$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/pindl', { url: args[0] }, 'apikey'))
             conn.sendFile(from, api.result.result, '', api.result.result, m)
             break
         }
         case /^yt(v|mp4)?$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/aiovideodl', { url: args[0] }, 'apikey'))
             let { url } = api.result.medias.filter(v => /720|480|360/.test(v.quality) && /true/.test(v.audioAvailable) && /true/.test(v.videoAvailable))[0]
             conn.sendFile(from, url, '', api.result.title, m)
             break
         }
         case /^yt(a|mp3)$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             await reply(mess.wait)
             let api = await functions.fetchJson(API('zaki', '/aiovideodl', { url: args[0] }, 'apikey'))
             let { url } = api.result.medias.filter(v => /128/.test(v.quality) && /true/.test(v.audioAvailable) && /false/.test(v.videoAvailable))[0]
             let audio = await functions.getBuffer(url)
             conn.sendMessage(from, audio, MessageType.audio, { mimetype: Mimetype.mp4Audio, quoted: m })
             break
         }
         case /^(tik(tok)?(dl)?)$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             await reply(mess.wait)
             conn.sendFile(from, API('zaki', '/tiktoknowm', { url: args[0] }, 'apikey'), '', '', m)
             break
         }
         case /^mediafire$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             let api = await functions.fetchJson(API('zaki', '/mediafire', { url: args[0] }, 'apikey'))
             let { title, link } = api.result
             reply(JSON.stringify(api.result, null, 2))
             conn.sendFile(from, link, title, '', m)
             break
         }
         case /^z(ippydl|ippyshare)$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             let api = await functions.fetchJson(API('zaki', '/zippyshare', { url: args[0] }, 'apikey'))
             let { nama, link } = api.result
             reply(JSON.stringify(api.result, null, 2))
             conn.sendFile(from, link, nama, '', m)
             break
         }
         case /^(twt|twitter)$/i.test(command): {
             if (!args.length > 0 || !args[0].includes('twitter.com') || args[0].includes('t.co')) return reply('URL needed')
             let api = await functions.fetchJson(API('zaki', '/twitter', { url: args[0] }, 'apikey'))
             await reply(mess.wait)
             if (api.result.type === 'video') {
                 const content = api.result.variants.filter(x => x.content_type !== 'application/x-mpegURL').sort((a, b) => b.bitrate - a.bitrate)
                 conn.sendFile(from, content[0].url, '', '', m)
             } else if (api.result.type === 'photo') {
                 for (let z = 0; z < api.result.variants.length; z++) {
                    conn.sendFile(from, api.result.type.variants[z], '', '', m)
                 }
             } else if (api.result.type === 'animated_gif') {
                 const content = api.result.type.variants[0]['url']
                 conn.sendFile(from, content, '', '', m)
             }
             break
         }
         case /^(fbdl)$/i.test(command): {
             try {
             if (!args[0]) return reply('URL needed.')
             let api = await functions.fetchJson(API('zaki', '/fbdl', { url: args[0] }, 'apikey'))
             await reply(mess.wait)
             if (api.result.length === 0) return reply('This link appears to be leading to a private post.')
                 conn.sendFile(from, api.result[api.result.length - 1], '', '', m)
             } catch(e) {
                 reply('Failed to download Facebook video from the given link.')
             }
             break
         }
         case /^anonfiles$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             let api = await functions.fetchJson(API('zaki', '/anonfiledl', { url: args[0] }, 'apikey'))
             let { title, link } = api.result
             reply(JSON.stringify(api.result, null, 2))
             conn.sendFile(from, link, title, '', m)
             break
         }
         case /^sfilemobidl$/i.test(command): {
             if (!args[0]) return reply('URL needed.')
             let api = await functions.fetchJson(API('zaki', '/sfiledl', { url: args[0] }, 'apikey'))
             let { title, link } = api.result
             reply(JSON.stringify(api.result, null, 2))
             conn.sendFile(from, link, title, '', m)
             break
         }
         case /^pixiv$/i.test(command): {
             if (args[0] && !isUrl(args[0])) {
                 await reply(mess.wait)
                 conn.sendFile(from, API('zaki', '/pixiv', { id: args[0], ext: args[1] || '.jpg' }, 'apikey'), '', '', m)
             } else if (args[0] && isUrl(args[0])) {
                 await reply(mess.wait)
                 conn.sendFile(from, API('zaki', '/pixiv', { id: args[0].split('/')[5], ext: args[1] || '.jpg' }, 'apikey'), '', '', m)
             } else reply(`*For Single Image*:\n${prefix + command} 86668346\n*For Multiple Images:*\n\n${prefix + command} 88314128-1\n(-1 is page number)`)
             break
         }
     }
})()