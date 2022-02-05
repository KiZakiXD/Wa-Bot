require('./config.js')
'use strict';
const { WAConnection, MessageType } = require('@adiwajshing/baileys')
const handler = require('./handler.js')
const simple = require('./lib/simple.js')
const Client = simple.WAConnection(WAConnection)
const fs = require('fs')
const functions = require('./lib/function.js')
const { color } = functions

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

async function start(session) {
    global.conn = new Client()
    console.log(color('[ ZAKI ]', 'yellow'), color('Loading...'))
    conn.on('qr', () => {
        console.log(color('[ ZAKI ]', 'yellow'), color('Scan QR Code'))
    })
    if (fs.existsSync(session)) conn.loadAuthInfo(session)
    conn.on('connecting', () => {
        console.log(color('[ NPC ]', 'yellow'), color('Connecting...'))
    })
    conn.on('open', () => {
        console.log(color('[ NPC ]', 'yellow'), color('Connected!!'))
    })
    conn.connect().then(() => {
        console.log(color('[ BOT ]', 'yellow'), color(`Success Connect to:\n• Name: ${conn.user.name}\n• No: ${conn.user.jid.split('@')[0]}`))
        fs.writeFileSync(session, JSON.stringify(conn.base64EncodedAuthInfo(), null, '\t'))
    })

    conn.on('chat-update', async(m) => {
        handler.chatUpdate(conn, m)
    })
}

start('session.json')