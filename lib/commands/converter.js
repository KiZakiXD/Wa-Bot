(async () => {
     switch(true) {
         case /^s(tic?ker)?(gif)?$/i.test(command): {
             let media = quoted ? quoted : m
             let mime =  (media.msg || media).mimetype || ''
             if (/image|video/.test(mime)) {
                 let img = await media.download()
                 await conn.sendSticker(from, img, m, { pack: packName, author: authorName, keepScale: /-crop/i.test(args[0]) ? false : true, crop: /-crop/i.test(args[0]) })
             } else if (isQuotedSticker && !quoted.isAnimated || isQuotedImage || isQuotedVideo) {
                 let img = await media.download()
                 await conn.sendSticker(from, img, m, { pack: packName, author: authorName, keepScale: /-crop/i.test(args[0]) ? false : true, crop: /-crop/i.test(args[0]) })
             } else reply(`Send a picture/video with a caption ${prefix + command} or tagged image/video that has been sent\nNote: Maximum video duration is 10 seconds`)
             break
         }
         case /^tourl$/i.test(command): {
             let q = quoted ? quoted : m
             let mime = (q.msg || q).mimetype || ''
             if (/image|video|sticker|audio|document/.test(mime)) {
                 let media = await q.download()
                 let link = await uploadFile(media)
                 reply(link)
             } else reply('tagged media that has been sent')
             break
         }
         case /^to(img|video)$/i.test(command): {
            if (isQuotedSticker && quoted.isAnimated == false) {
            	reply(mess.wait)
                await convert.webp2png(await quoted.download()).then(v => conn.sendFile(from, v, '', '', m))
            } else if (isQuotedSticker && quoted.isAnimated == true) {
            	reply(mess.wait)
                await convert.webp2mp4(await quoted.download()).then(v => conn.sendFile(from, v, '', '', m))
            } else reply('tagged s/sgif that has been sent')
            break
        }
        case /^to(mp3|a(udio)?)$/i.test(command): {
            let media = quoted ? quoted : m
            if (isQuotedDocument && /video/.test(quoted.mimetype) || /video/.test(media.mtype)) {
            	reply(mess.wait)
                await convert.toAudio(await media.download(), 'mp4').then(v => conn.sendMessage(from, v, 'audioMessage', { quoted: m, mimetype: 'audio/mp4' }))
            } else if (isQuotedDocument && /audio/.test(quoted.mimetype) || isQuotedAudio) {
            	reply(mess.wait)
                await convert.toPTT(await media.download(), 'mp4').then(v => conn.sendMessage(from, v, 'audioMessage', { quoted: m, ptt: true, mimetype: 'audio/mp4' }))
            } else reply(`Send a video with a caption ${prefix + command} or tagged video that has been sent`)
            break
        }
     } 
})()