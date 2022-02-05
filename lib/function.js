const util = require('util')
const axios = require('axios')
const got = require('got')
const chalk = require('chalk')
const fetch = require('node-fetch')
const FormData = require('form-data')
const { fromBuffer } = require('file-type')
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')

exports.color = (text, color) => {
	return chalk.keyword(color || 'skyblue')(text)
}
exports.print = (text) => {
	if (typeof text !== 'string') text = util.inspect(text)
	text = util.format(text)
	return text
}
exports.pickRandom = (list) => {
	return list[Math.floor(Math.random() * list.length)]
}
exports.sleep = (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms))
}
exports.urlShort = async(url) => {
  const res = await axios.get('https://tinyurl.com/api-create.php?url='+url)
  return res.data
}
exports.isUrl = (url) => {
	return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}
exports.getTime = (format, date) => {
	if (date) {
		return moment(date).locale('id').format(format)
	} else {
		return moment.tz('Asia/Jakarta').locale('id').format(format)
	}
}
exports.getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (e) {
		console.log(`Error : ${e}`)
	}
}
exports.fetchJson = async(url, opts = {}) => {
	let response = await fetch(url, opts)
	if (response.status !== 200) throw { status: response.status, message: response.statusText }
	return response.json()
}
exports.fetchText = async(url, opts = {}) => {
	let response = await fetch(url, opts)
	if (response.status !== 200) throw { status: response.status, message: response.statusText }
	return response.text()
}
exports.processTime = (timestamp, now) => {
	return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}
exports.clockString = (ms) => {
	let h = isNaN(ms) ? '--' : Math.floor(ms % (3600 * 24) / 3600)
	let m = isNaN(ms) ? '--' : Math.floor(ms % 3600 / 60)
	let s = isNaN(ms) ? '--' : Math.floor(ms % 60)
	return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
exports.bytesToSize = (number) => {
	let tags = [' Bytes', ' KB', ' MB', ' GB', ' TB']
	let tier = Math.log10(Math.abs(number)) / 3 | 0
	if (tier == 0) return number
	let tag = tags[tier]
	let scale = Math.pow(10, tier * 3)
	let scaled = number / scale
	let formatted = scaled.toFixed(1)
	if (/\.0$/.test(formatted))
	formatted = formatted.substr(0, formatted.length - 2)
	return formatted + tag
}
exports.parseMs = (ms) => {
	if (typeof ms !== 'number') throw 'Parameter must be filled with number'
	return {
		days: Math.trunc(ms / 86400000),
		hours: Math.trunc(ms / 3600000) % 24,
		minutes: Math.trunc(ms / 60000) % 60,
		seconds: Math.trunc(ms / 1000) % 60,
		milliseconds: Math.trunc(ms) % 1000,
		microseconds: Math.trunc(ms * 1000) % 1000,
		nanoseconds: Math.trunc(ms * 1e6) % 1000
	}
}
exports.parseResult = (json, options = {}) => {
	// github: https://github.com/Zobin33/Anu-Wabot/blob/master/lib/functions.js#L81
	let opts = {
		unicode: true,
		ignoreVal: [null, undefined],
		ignoreKey: [],
		title: conn.user.name,
		headers: `%title\n`,
		body: `• *%key*: %value`,
		footer: '\n',
		...options
	}
	let { unicode, ignoreKey, title, headers, ignoreVal, body, footer } = opts
	let obj = Object.entries(json)
	let tmp = []
	for (let [_key, val] of obj) {
		if (ignoreVal.indexOf(val) !== -1) continue
		let key = _key[0].toUpperCase() + _key.slice(1)
		let type = typeof val
		if (ignoreKey && ignoreKey.includes(_key)) continue
		switch (type) {
			case 'boolean':
			tmp.push([key, val ? 'Ya' : 'Tidak'])
			break
			case 'object':
			if (Array.isArray(val)) tmp.push([key, val.join(', ')])
			else tmp.push([key, exports.parseResult(val, { ignoreKey, unicode: false }), ])
			break
			default:
			tmp.push([key, val])
			break
		}
	}
	if (unicode) {
		let text = [
			headers.replace(/%title/g, title), tmp.map((v) => {
				return body.replace(/%key/g, v[0]).replace(/%value/g, v[1])
			}).join('\n'), footer
		]
		return text.join('\n').trim()
	}
	return tmp
}
exports.getAdmin = function(participants) {
    let admins = new Array()
    for (let _ of participants) {
        _.isAdmin ? admins.push(_.jid) : ''
    }
    return admins
}
exports.uploadFile = async (buffer) => {
	let { ext } = await fromBuffer(buffer)
	let form = new FormData
	form.append('file', buffer, 'tmp.' + ext)
	let res = await axios({
		url: 'https://upload.ichikaa.xyz/upload',
		method: 'post',
		data: form,
		headers: {
			'Content-Type': `multipart/form-data; boundary=${form._boundary}`
		}
	})
	let img = res.data
	if (img.error) throw img.error
	return img.result.url
}