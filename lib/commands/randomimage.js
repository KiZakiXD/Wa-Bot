(async () => {
     switch(true) {
         case /^(loli|husbu|waifu|milf|neko|shinobu|megumin)$/i.test(command): {
            await reply(mess.wait)
            conn.sendFile(from, API('zaki', '/randomimage/'+ command, {}, 'apikey'), '', '*Random:* ' + command, m)
            break
         }
     }
})()