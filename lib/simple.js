const util = require('util')
const got = require('got')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const jimp_1 = require('jimp')
const { tmpdir } = require('os')
const request = require('request')
const fetch = require('node-fetch')
const FileType = require('file-type')
const { exec } = require('child_process')
const PhoneNumber = require('awesome-phonenumber')
const {
	MessageType,
	WAMessageProto,
	DEFAULT_ORIGIN,
	getAudioDuration,
	MessageTypeProto,
	MediaPathMap,
	Mimetype,
	MimetypeMap,
	compressImage,
	generateMessageID,
	randomBytes,
	getMediaKeys,
	aesEncrypWithIV,
	hmacSign,
	sha256,
	encryptedStream
} = require('@adiwajshing/baileys')
const { toAudio, toPTT, toVideo, convertSticker, mp4ToWebp } = require('./converter')
const { WAConnection } = require('@adiwajshing/baileys/lib/WAConnection/0.Base')
const { WAMetric } = require('@adiwajshing/baileys/lib/WAConnection/Constants')

exports.WAConnection = _WAConnection => {
	class WAConnection extends _WAConnection {
		constructor(...args) {
			super(...args)
			if (!Array.isArray(this._events['CB:action,add:relay,message'])) this._events['CB:action,add:relay,message'] = [this._events['CB:action,add:relay,message']]
			else this._events['CB:action,add:relay,message'] = [this._events['CB:action,add:relay,message'].pop()]
			this._events['CB:action,add:relay,message'].unshift(async function(json) {
				try {
					let m = json[2][0][2]
					if (m.message && m.message.protocolMessage && m.message.protocolMessage.type == 0) {
						let key = m.message.protocolMessage.key
						let c = this.chats.get(key.remoteJid)
						let a = c.messages.dict[`${key.id}|${key.fromMe ? 1 : 0}`]
						let participant = key.fromMe ? this.user.jid : a.participant ? a.participant : key.remoteJid
						let WAMSG = WAMessageProto.WebMessageInfo
						this.emit('message-delete', {
							key,
							participant,
							message: WAMSG.fromObject(WAMSG.toObject(a))
						})
					}
				} catch (e) {}
			})
			this.on('CB:action,,battery', json => {
				this.battery = Object.fromEntries(Object.entries(json[2][0][1]).map(v => [v[0], eval(v[1])]))
				console.log(this.battery)
			})
			this.browserDescription = ['bot-wa', 'Edge', '6.9']
			this.sendFileFromUrl = this.sendFileFromURL = this.sendFile
		}
		
		async rejectIncomingCall(jid, id) {
			const tag = this.generateMessageTag();
			const nodePayload = ['action', 'call', ['call', { 'from': this.user.jid, 'to': `${jid.split('@')[0]}@s.whatsapp.net`, 'id': tag }, [['reject', { 'call-id': id, 'call-creator': `${jid.split('@')[0]}@s.whatsapp.net`, 'count': '0' }, null]]]];
			const response = await this.sendJSON(nodePayload, tag);
			return response
		}
		
		async updateProfilePicture(jid, img) {
			const data = await generateProfilePicture(img)
			const tag = this.generateMessageTag()
			const query = ['picture', { jid: jid, id: tag, type: 'set' }, [['image', null, data.img], ['preview', null, data.preview]]]
			const response = await (this.setQuery([query], [WAMetric.picture, 136], tag))
			if (jid === this.user.jid) this.user.imgUrl = response.eurl
			else if (this.chats.get(jid)) {
				this.chats.get(jid).imgUrl = response.eurl
				this.emit('chat-update', { jid, imgUrl: response.eurl })
			}
			return response
		}
		
        async sendSticker(jid, path, quoted = null, opt = {}) {
            let { mime, data } = await this.getFile(path)
            let stc
            try {
               if (/image/.test(mime)) stc = await convertSticker(data, { author: opt.author, pack: opt.pack, keepScale: opt.keepScale, circle: opt.circle })
               else if (/video/.test(mime)) stc = await mp4ToWebp(data, { author: opt.author, pack: opt.pack, crop: opt.crop })
            } catch (e) {
               stc = e
            } finally {
               this.reply(jid, stc, quoted)
            }
        }
		
		async copyNForward(jid, message, forceForward = false, options = {}) {
			let vtype
			if (options.readViewOnce) {
				message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
				vtype = Object.keys(message.message.viewOnceMessage.message)[0]
				delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
				delete message.message.viewOnceMessage.message[vtype].viewOnce
				message.message = {
					...message.message.viewOnceMessage.message
				}
			}
			let mtype = Object.keys(message.message)[0]
			let content = await this.generateForwardMessageContent(message, forceForward)
			let ctype = Object.keys(content)[0]
			let context = {}
			if (mtype != MessageType.text) context = message.message[mtype].contextInfo
			content[ctype].contextInfo = {
				...context,
				...content[ctype].contextInfo
			}
			const waMessage = await this.prepareMessageFromContent(jid, content, options ? {
				...content[ctype],
				...options,
				...(options.contextInfo ? {
					contextInfo: {
						...content[ctype].contextInfo,
						...options.contextInfo
					}
				} : {})
			} : {})
			await this.relayWAMessage(waMessage)
			return waMessage
		}
		
		cMod(jid, message, text = '', sender = this.user.jid, options = {}) {
			let copy = message.toJSON()
			let mtype = Object.keys(copy.message)[0]
			let isEphemeral = mtype === 'ephemeralMessage'
			if (isEphemeral) {
				mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
			}
			let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
			let content = msg[mtype]
			if (typeof content === 'string') msg[mtype] = text || content
			else if (content.caption) content.caption = text || content.caption
			else if (content.text) content.text = text || content.text
			if (typeof content !== 'string') msg[mtype] = {
				...content,
				...options
			}
			if (copy.participant) sender = copy.participant = sender || copy.participant
			else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
			if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
			else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
			copy.key.remoteJid = jid
			copy.key.fromMe = sender === this.user.jid
			return WAMessageProto.WebMessageInfo.fromObject(copy)
        }
     
        fetchRequest = async (endpoint, method = 'GET', body, agent, headers, redirect = 'follow') => {
			try {
				let res = await fetch(endpoint, {
					method,
					body,
					redirect,
					headers: {
						Origin: DEFAULT_ORIGIN,
						...(headers || {})
					},
					agent: agent || this.connectOptions.fetchAgent
				})
				return await res.json()
			} catch (e) {
				console.error(e)
				let res = await got(endpoint, {
					method,
					body,
					followRedirect: redirect == 'follow' ? true : false,
					headers: {
						Origin: DEFAULT_ORIGIN,
						...(headers || {})
					},
					agent: {
						https: agent || this.connectOptions.fetchAgent
					}
				})
				return JSON.parse(res.body)
			}
		}
		
		async prepareMessageMedia(buffer, mediaType, options = {}) {
			await this.waitForConnection()
			if (mediaType === MessageType.document && !options.mimetype) {
				throw new Error('mimetype required to send a document')
			}
			if (mediaType === MessageType.sticker && options.caption) {
				throw new Error('cannot send a caption with a sticker')
			}
			if (!(mediaType === MessageType.image || mediaType === MessageType.video) && options.viewOnce) {
				throw new Error(`cannot send a ${mediaType} as a viewOnceMessage`)
			}
			if (!options.mimetype) {
				options.mimetype = MimetypeMap[mediaType]
			}
			let isGIF = false
			if (options.mimetype === Mimetype.gif) {
				isGIF = true
				options.mimetype = MimetypeMap[MessageType.video]
			}
			const requiresThumbnailComputation = (mediaType === MessageType.image || mediaType === MessageType.video) && !('thumbnail' in options)
			const requiresDurationComputation = mediaType === MessageType.audio && !options.duration
			const requiresOriginalForSomeProcessing = requiresDurationComputation || requiresThumbnailComputation
			const mediaKey = randomBytes(32)
			const mediaKeys = getMediaKeys(mediaKey, mediaType)
			const enc = aesEncrypWithIV(buffer, mediaKeys.cipherKey, mediaKeys.iv)
			const mac = hmacSign(Buffer.concat([mediaKeys.iv, enc]), mediaKeys.macKey).slice(0, 10)
			const body = Buffer.concat([enc, mac])
			const fileSha256 = sha256(buffer)
			const fileEncSha256 = sha256(body)
			const {
				encBodyPath,
				bodyPath,
				fileLength,
				didSaveToTmpPath
			} = await encryptedStream(buffer, mediaType, requiresOriginalForSomeProcessing)
			const fileEncSha256B64 = encodeURIComponent(
				fileEncSha256
				.toString('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/\=+$/, '')
			)
			if (requiresThumbnailComputation) await generateThumbnail(bodyPath, mediaType, options)
			if (requiresDurationComputation) {
				try {
					options.duration = await getAudioDuration(bodyPath)
				} catch (error) {
					this.logger.debug({ error }, 'failed to obtain audio duration: ' + error.message)
				}
			}
			let json = await this.refreshMediaConn(options.forceNewMediaOptions)
			let mediaUrl = ''
			for (let host of json.hosts) {
				const auth = encodeURIComponent(json.auth) // the auth token
				const url = `https://${host.hostname}${MediaPathMap[mediaType]}/${fileEncSha256B64}?auth=${auth}&token=${fileEncSha256B64}`
				try {
					const result = await this.fetchRequest(url, 'POST', body, options.uploadAgent, {
						'Content-Type': 'application/octet-stream'
					})
					mediaUrl = result && result.url ? result.url : undefined
					if (mediaUrl) break
					else {
						json = await this.refreshMediaConn(true)
						throw new Error(`upload failed, reason: ${JSON.stringify(result)}`)
					}
				} catch (error) {
					const isLast = host.hostname === json.hosts[json.hosts.length - 1].hostname
					this.logger.error(`Error in uploading to ${host.hostname}${isLast ? '' : ', retrying...'}`)
				}
			}
			if (!mediaUrl) throw new Error('Media upload failed on all hosts')
			await Promise.all([fs.promises.unlink(encBodyPath), didSaveToTmpPath && bodyPath && fs.promises.unlink(bodyPath)].filter(f => typeof f == 'boolean'))
			const message = {
				[mediaType]: MessageTypeProto[mediaType].fromObject({
					url: mediaUrl,
					mediaKey: mediaKey,
					mimetype: options.mimetype,
					fileEncSha256: fileEncSha256,
					fileSha256: fileSha256,
					fileLength: fileLength,
					seconds: options.duration,
					fileName: options.filename || 'file',
					gifPlayback: isGIF || undefined,
					caption: options.caption,
					ptt: options.ptt,
					viewOnce: options.viewOnce,
					isAnimated: options.isAnimated
				})
			}
			return WAMessageProto.Message.fromObject(message)
		}
		
		async getFile(path) {
			let res
			let data = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (res = await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : typeof path === 'string' ? path : Buffer.alloc(0)
			if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
			let type = await FileType.fromBuffer(data) || {
				mime: 'application/octet-stream',
				ext: '.bin'
			}
			return { res, ...type, data }
		}
		
		async sendFile(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
			let type = await this.getFile(path)
			let { res, data: file } = type
			if (res && res.status !== 200 || file.length <= 65536) {
				try {
					throw { json: JSON.parse(file.toString()) }
				} catch (e) {
					if (e.json) throw e.json
				}
			}
			let opt = { filename, caption }
			if (quoted) opt.quoted = quoted
			if (!type)
			if (options.asDocument) options.asDocument = true
			let mtype = ''
			if (options.asSticker) mtype = MessageType.sticker
			else if (!options.asDocument && !options.type) {
				if (options.force) file = file
				else if (/audio/.test(type.mime)) file = await (ptt ? toPTT : toAudio)(file, type.ext)
				else if (/video/.test(type.mime)) file = await toVideo(file, type.ext)
				if (/webp/.test(type.mime) && file.length <= 1 << 20) mtype = MessageType.sticker
				else if (/image/.test(type.mime)) mtype = MessageType.image
				else if (/video/.test(type.mime)) mtype = MessageType.video
				else opt.displayName = opt.caption = filename
				if (options.asGIF && mtype === MessageType.video) mtype = MessageType.gif
				if (/audio/.test(type.mime)) {
					mtype = MessageType.audio
					if (!ptt) opt.mimetype = 'audio/mp4'
					opt.ptt = ptt
				} else if (/pdf/.test(type.ext)) mtype = MessageType.pdf
				else if (!mtype) {
					mtype = MessageType.document
					opt.mimetype = type.mime
				}
			} else {
				mtype = options.type ? options.type : MessageType.document
				opt.mimetype = type.mime
			}
			delete options.asDocument
			delete options.asGIF
			delete options.asSticker
			delete options.type
			if (mtype === MessageType.document) opt.title = filename
			if (mtype === MessageType.sticker || !opt.caption) delete opt.caption
			return await this.sendMessage(jid, file, mtype, { ...opt, ...options
			})
		}
		
		reply(jid, text, quoted, options) {
			return Buffer.isBuffer(text) ? this.sendFile(jid, text, 'file', '', quoted, false, options) : this.sendMessage(jid, text, MessageType.extendedText, { quoted, ...options })
		}
		
		async inviteInfo(teks) {
			let [_, code] = teks.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i) || []
			if (!code) return { status: 403 }
			let res = await this.query({
				json: ['query', 'invite', code]
			})
			if (res.status !== 200) return res
			return res
		}
		
		async toMSG(buffer, type) {
			let data = await this.prepareMessage('0@s.whatsapp.net', buffer, type)
			data = Object.keys(data.message)[0] === 'ephemeralMessage' ? data.message.ephemeralMessage : data.message
			return data[type]
		}
		
		parseMention(text = '') {
			return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
		}
		
		getName(jid) {
			let v = jid === '0@s.whatsapp.net' ? { jid, vname: 'WhatsApp' } : jid === this.user.jid ? this.user : this.contactAddOrGet(jid)
			return v.notify || v.short || v.vname || v.name || PhoneNumber('+' + v.jid.split('@')[0]).getNumber('international')
		}
		
		async downloadM(m) {
			if (!m) return Buffer.alloc(0)
			if (!m.message) m.message = { m }
			if (!m.message[Object.keys(m.message)[0]].url) await this.updateMediaMessage(m)
			return await this.downloadMediaMessage(m)
		}
		
		serializeM(m) {
			return exports.smsg(this, m)
		}
	}
	return WAConnection
}

exports.smsg = (conn, m, hasParent) => {
	if (!m) return m
	let M = WAMessageProto.WebMessageInfo
	if (m.key) {
		m.id = m.key.id
		m.isBaileys = m.id.startsWith('3EB0') && m.id.length === 12
		m.chat = m.key.remoteJid
		m.fromMe = m.key.fromMe
		m.isGroup = m.chat.endsWith('@g.us')
		m.sender = m.fromMe ? conn.user.jid : m.participant ? m.participant : m.key.participant ? m.key.participant : m.chat
	}
	if (m.message) {
		m.mtype = Object.keys(m.message)[0]
		m.msg = m.message[m.mtype]
		if (m.mtype === 'ephemeralMessage') {
			exports.smsg(conn, m.msg)
			m.mtype = m.msg.mtype
			m.msg = m.msg.msg
		}
		let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
		m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
		if (m.quoted) {
			let type = Object.keys(m.quoted)[0]
			m.quoted = m.quoted[type]
			if (['productMessage'].includes(type)) {
				type = Object.keys(m.quoted)[0]
				m.quoted = m.quoted[type]
			}
			if (typeof m.quoted === 'string') m.quoted = {
				text: m.quoted
			}
			m.quoted.mtype = type
			m.quoted.id = m.msg.contextInfo.stanzaId
			m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
			m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('3EB0') && m.quoted.id.length === 12 : false
			m.isQuotedImage = m.quoted ? m.quoted.mtype === MessageType.image : false
			m.isQuotedVideo = m.quoted ? m.quoted.mtype === MessageType.video : false
			m.isQuotedSticker = m.quoted ? m.quoted.mtype === MessageType.sticker : false
			m.isQuotedAudio = m.quoted ? m.quoted.mtype === MessageType.audio : false
			m.isQuotedDocument = m.quoted ? m.quoted.mtype === MessageType.document : false
			m.quoted.sender = m.msg.contextInfo.participant
			m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.jid)
			m.quoted.text = m.quoted.text || m.quoted.caption || ''
			m.quoted.mentionedJid = m.quoted.contextInfo ? m.quoted.contextInfo.mentionedJid : []
			m.getQuotedObj = m.getQuotedMessage = async () => {
				if (!m.quoted.id) return false
				let q = await conn.loadMessage(m.chat, m.quoted.id)
				return exports.smsg(conn, q)
			}
			let vM = m.quoted.fakeObj = M.fromObject({
				key: {
					fromMe: m.quoted.fromMe,
					remoteJid: m.quoted.chat,
					id: m.quoted.id
				},
				message: quoted,
				...(m.isGroup ? {
					participant: m.quoted.sender
				} : {})
			})
			if (m.quoted.url) m.quoted.download = (type = 'buffer') => conn.downloadM(vM, type)
			m.quoted.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, vM, options)
			m.quoted.copy = () => exports.smsg(conn, M.fromObject(M.toObject(vM)))
			m.quoted.forward = (jid, forceForward = false) => conn.forwardMessage(jid, vM, forceForward)
			m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options)
			m.quoted.cMod = (jid, text = '', sender = m.quoted.sender, options = {}) => conn.cMod(jid, vM, text, sender, options)
			m.quoted.delete = () => conn.deleteMessage(m.quoted.chat, vM.key)
		}
		if (m.msg.url) m.download = (type = 'buffer') => conn.downloadM(m, type)
		m.text = (m.mtype == 'buttonsResponseMessage' ? m.message.buttonsResponseMessage.selectedButtonId : '') || (m.mtype == 'listResponseMessage' ? m.msg.singleSelectReply.selectedRowId : '') || m.msg.text || m.msg.caption || m.msg || ''
		m.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, m, { detectLinks: false, thumbnail: global.thumb, ...options })
		m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))
		m.forward = (jid = m.chat, forceForward = false) => conn.forwardMessage(jid, m, forceForward)
		m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options)
		m.cMod = (jid, text = '', sender = m.sender, options = {}) => conn.cMod(jid, m, text, sender, options)
	}
	return m
}

async function generateProfilePicture(buffer) {
	const jimp = await jimp_1.read(buffer)
	const min = jimp.getWidth()
	const max = jimp.getHeight()
	const cropped = jimp.crop(0, 0, min, max)
	return {
		img: await cropped.scaleToFit(720, 720).getBufferAsync(jimp_1.MIME_JPEG),
		preview: await cropped.normalize().getBufferAsync(jimp_1.MIME_JPEG)
	}
}
async function generateThumbnail(file, mediaType, info) {
	const alternate = (Buffer.alloc(1)).toString('base64')
	if ('thumbnail' in info) {
		if (mediaType === MessageType.audio) {
			throw new Error('audio messages cannot have thumbnails')
		}
	} else if (mediaType === MessageType.image) {
		try {
			const buff = await compressImage(file)
			info.thumbnail = buff.toString('base64')
		} catch (err) {
			console.error(err)
			info.thumbnail = alternate
		}
	} else if (mediaType === MessageType.video) {
		const imgFilename = path.join(tmpdir(), generateMessageID() + '.jpg')
		try {
			try {
				await extractVideoThumb(file, imgFilename, '00:00:00', { width: 48, height: 48 })
				const buff = await fs.promises.readFile(imgFilename)
				info.thumbnail = buff.toString('base64')
				await fs.promises.unlink(imgFilename)
			} catch (e) {
				console.error(e)
				info.thumbnail = alternate
			}
		} catch (err) {
			console.log('could not generate video thumb: ' + err)
		}
	}
}
const extractVideoThumb = async (path, destPath, time, size = {}) =>
	new Promise((resolve, reject) => {
		const cmd = `ffmpeg -ss ${time} -i ${path} -y -s ${size.width}x${size.height} -vframes 1 -f image2 ${destPath}`
		exec(cmd, (err) => {
			if (err) reject(err)
			else resolve()
		})
	})
