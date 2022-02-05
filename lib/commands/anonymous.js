(async () => {
     switch(true) {
         case /^next$/i.test(command): {
             if (isGroup) return reply('This feature can only be used in private chat')
             let rom = Object.values(anonymous).find(room => room.check(sender))
             if (!rom) {
                conn.reply(from, 'You have no partner 🤔\nType '+ prefix +'search to find a new partner', m)
             }
             let other = rom.other(sender)
             if (other) {
                 conn.reply(other, 'Your partner has stopped the dialog 😞\nType '+ prefix +'search to find a new partner', m)
             }
             delete anonymous[rom.id]
         } 
         case /^(start|search)$/i.test(command): {
             if (isGroup) return reply('This feature can only be used in private chat')
             if (Object.values(anonymous).find(room => room.check(sender))) return reply('Kamu masih berada di dalam anonymous chat')
             let room = Object.values(anonymous).find(room => room.state === "WAITING" && !room.check(sender))
             if (room) {
                 conn.reply(room.c, 'Partner found 🐵\n'+ prefix + 'next — find a new partner\n'+ prefix + 'stop — stop this dialog', m)
                 room.b = sender
                 room.state = "CHATTING"
                 conn.reply(from, 'Partner found 🐵\n' + prefix + 'next — find a new partner\n'+ prefix + 'stop — stop this dialog', m)
             } else {
                 let ifd = +new Date()
                 anonymous[ifd] = {
                     id: ifd,
                     c: sender,
                     b: '',
                     state: "WAITING",
                     check: function (who = '') {
                     return [this.c, this.b].includes(who)
                 },
                 other: function (who = '') {
                     return who === this.c ? this.b : who === this.b ? this.c : ''
                 },
             }
             reply('Looking for a partner...')
             }
             break
         }
         case /^stop$/i.test(command): {
             if (isGroup) return reply('This feature can only be used in private chat')
             let reme = Object.values(anonymous).find(room => room.check(sender))
             if (!reme) {
                 conn.reply(from, 'You have no partner 🤔\nType '+ prefix + 'search to find a new partner', m)
             }
             conn.reply(from, 'You stopped the dialog 🙄\nType '+ prefix + 'search to find a new partner', m)
             delete anonymous[reme.id]
             let erh = reme.other(sender)
             if (erh) {
                 conn.reply(erh, 'Your partner has stopped the dialog 😞\nType '+ prefix +'search to find a new partner', m)
             }
             break
         }
     } 
})()