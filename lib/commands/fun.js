(async () => {
     switch(true) {
         case /^bonk$/i.test(command): {
             let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
             conn.sendSticker(from, API('zaki', '/bonk', { url: await conn.getProfilePicture(who).catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'), url2: await conn.getProfilePicture(sender).catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png')}, 'apikey'), m, { pack: packName, author: authorName, keepScale: true })
             break
         }
         case /^ship$/i.test(command): {
             let stat = pickRandom(['teman', 'pacar', 'sahabat', 'saudara'])
             let numb = Math.floor(Math.random() * 100) + 1
             let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
             conn.sendFile(from, API('zaki', '/ship', { name: pushname, name2: conn.getName(who), avatar: await conn.getProfilePicture(sender).catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'), avatar2: await conn.getProfilePicture(who).catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'), num: numb, status: stat }, 'apikey'), 'ship.png', 'Stay together and you ll find a way ⭐️', m)
             break
         }
         case /^(gay)$/i.test(command): {
             let numb = Math.floor(Math.random() * 100) + 1
             let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
             conn.sendFile(from, API('zaki', '/seberapagay', { name: conn.getName(who), image: await conn.getProfilePicture(who).catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'), num: numb }, 'apikey'), 'gay.png', 'Lariii ada gay', m)
             break
         }
         case /^(kiss|bully|cry|hug|lick|slap)$/i.test(command): {
             if (m.quoted && m.quoted.sender) m.mentionedJid.push(m.quoted.sender)
             if (!m.mentionedJid.length) m.mentionedJid.push(m.sender)
             let data = await functions.getBuffer(API('zaki', '/randomimage/'+ command, {}, 'apikey'))
             let input = `${command}.gif`
             let output = `${command}.mp4`
             await fs.writeFileSync(input, data)
             exec(`ffmpeg -i ${input} -movflags faststart -pix_fmt yuv420p -vf 'scale=trunc(iw/2)*2:trunc(ih/2)*2' ${output}`, async (e) => {
                 if (e) throw e.toString()
                 await fs.unlinkSync(input)
                 conn.sendFile(from, output, '', `@${m.sender.split('@')[0]} ${command} ${m.mentionedJid.map((user) => user === m.sender ? 'themselves ' : `@${user.split('@')[0]}`).join(', ')}`, m, false, { mimetype: 'video/gif', contextInfo: { mentionedJid: [...m.mentionedJid, m.sender] }})
                 await fs.unlinkSync(output)
             })
             break
         }
     }
})()
