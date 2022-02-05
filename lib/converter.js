const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { exec, spawn } = require('child_process')
const fetch = require('node-fetch')
const FormData = require('form-data')
const { JSDOM } = require('jsdom')
const cheerio = require('cheerio')
const { default: Axios } = require('axios')

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
	return new Promise(async (resolve, reject) => {
		try {
			let tmp = path.join(__dirname, '../lib', +new Date + '.' + ext)
			let out = tmp + '.' + ext2
			await fs.promises.writeFile(tmp, buffer)
			spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
				.on('error', reject)
				.on('close', async (code) => {
					try {
						await fs.promises.unlink(tmp)
						if (code !== 0) return reject(code)
						resolve(await fs.promises.readFile(out))
						await fs.promises.unlink(out)
					} catch (e) {
						reject(e)
					}
				})
		} catch (e) {
			reject(e)
		}
	})
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toAudio(buffer, ext) {
	return ffmpeg(buffer, [
		'-vn',
		'-ac', '2',
		'-b:a', '128k',
		'-ar', '44100',
		'-f', 'mp3'
	], ext, 'mp3')
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toPTT(buffer, ext) {
	return ffmpeg(buffer, [
		'-vn',
		'-c:a', 'libopus',
		'-b:a', '128k',
		'-vbr', 'on',
		'-compression_level', '10'
	], ext, 'opus')
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension 
 */
function toVideo(buffer, ext) {
	return ffmpeg(buffer, [
		'-c:v', 'libx264',
		'-c:a', 'aac',
		'-ab', '128k',
		'-ar', '44100',
		'-crf', '32',
		'-preset', 'slow'
	], ext, 'mp4')
}

function convertSticker(file, stickerMetadata) {
	return new Promise(async (resolve, reject) => {
		if (stickerMetadata) {
			if (!stickerMetadata.author) stickerMetadata.author = '‎'
			if (!stickerMetadata.pack) stickerMetadata.pack = '‎'
			stickerMetadata.keepScale = (stickerMetadata.keepScale !== undefined) ? stickerMetadata.keepScale : false
			stickerMetadata.circle = (stickerMetadata.circle !== undefined) ? stickerMetadata.circle : false
		} else if (!stickerMetadata) {
			stickerMetadata = {
				author: '‎',
				pack: '‎',
				keepScale: false,
				circle: false,
				removebg: 'HQ'
			}
		}
		let getBase64 = Buffer.isBuffer(file) ? file.toString('base64') : (typeof file === 'string' && fs.existsSync(file)) ? fs.readFileSync(file).toString('base64') : null
		if (!getBase64) return reject('File Base64 Undefined')
		const Format = {
			image: `data:image/jpeg;base64,${getBase64}`,
			stickerMetadata: {
				...stickerMetadata
			},
			sessionInfo: {
				WA_VERSION: '2.2106.5',
				PAGE_UA: 'WhatsApp/2.2037.6 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
				WA_AUTOMATE_VERSION: '3.6.10 UPDATE AVAILABLE: 3.6.11',
				BROWSER_VERSION: 'HeadlessChrome/88.0.4324.190',
				OS: 'Windows Server 2016',
				START_TS: 1614310326309,
				NUM: '6247',
				LAUNCH_TIME_MS: 7934,
				PHONE_VERSION: '2.20.205.16'
			},
			config: {
				sessionId: 'session',
				headless: true,
				qrTimeout: 20,
				authTimeout: 0,
				cacheEnabled: false,
				useChrome: true,
				killProcessOnBrowserClose: true,
				throwErrorOnTosBlock: false,
				chromiumArgs: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--aggressive-cache-discard',
					'--disable-cache',
					'--disable-application-cache',
					'--disable-offline-load-stale-cache',
					'--disk-cache-size=0'
				],
				executablePath: 'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
				skipBrokenMethodsCheck: true,
				stickerServerEndpoint: true
			}
		}
		await axios({
			url: 'https://sticker-api-tpe3wet7da-uc.a.run.app/prepareWebp',
			method: 'post',
			headers: {
				Accept: 'application/json, text/plain, /',
				'Content-Type': 'application/json;charset=utf-8',
			},
			data: JSON.stringify(Format)
		}).then(({ data }) => {
			return resolve(Buffer.from(data.webpBase64, 'base64'))
		}).catch((err) => reject(err))
	})
}

function mp4ToWebp(file, stickerMetadata) {
	return new Promise(async (resolve, reject) => {
		if (stickerMetadata) {
			if (!stickerMetadata.author) stickerMetadata.author = '‎'
			if (!stickerMetadata.pack) stickerMetadata.pack = '‎'
		} else if (!stickerMetadata) {
			stickerMetadata = {
				author: '‎',
				pack: '‎'
			}
		}
		let getBase64 = Buffer.isBuffer(file) ? file.toString('base64') : (typeof file === 'string' && fs.existsSync(file)) ? fs.readFileSync(file).toString('base64') : null
		if (!getBase64) return reject('File Base64 undefined')
		const Format = {
			file: `data:video/mp4;base64,${getBase64}`,
			processOptions: {
				crop: (stickerMetadata.crop !== undefined) ? stickerMetadata.crop : false,
				startTime: '00:00:00.0',
				endTime: '00:00:7.0',
				loop: 0
			},
			stickerMetadata: {
				...stickerMetadata
			},
			sessionInfo: {
				WA_VERSION: '2.2106.5',
				PAGE_UA: 'WhatsApp/2.2037.6 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
				WA_AUTOMATE_VERSION: '3.6.10 UPDATE AVAILABLE: 3.6.11',
				BROWSER_VERSION: 'HeadlessChrome/88.0.4324.190',
				OS: 'Windows Server 2016',
				START_TS: 1614310326309,
				NUM: '6247',
				LAUNCH_TIME_MS: 7934,
				PHONE_VERSION: '2.20.205.16'
			},
			config: {
				sessionId: 'session',
				headless: true,
				qrTimeout: 20,
				authTimeout: 0,
				cacheEnabled: false,
				useChrome: true,
				killProcessOnBrowserClose: true,
				throwErrorOnTosBlock: false,
				chromiumArgs: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--aggressive-cache-discard',
					'--disable-cache',
					'--disable-application-cache',
					'--disable-offline-load-stale-cache',
					'--disk-cache-size=0'
				],
				executablePath: 'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
				skipBrokenMethodsCheck: true,
				stickerServerEndpoint: true
			 }
		}
		await axios({
			url: 'https://sticker-api.openwa.dev/convertMp4BufferToWebpDataUrl',
			method: 'post',
			headers: {
				Accept: 'application/json, text/plain, /',
				'Content-Type': 'application/json;charset=utf-8',
			},
			data: JSON.stringify(Format)
		}).then(({ data }) => {
			return resolve(Buffer.from(data.split(';base64,')[1], 'base64'))
		}).catch((err) => reject(err))
	})
}

async function webp2mp4(source) {
	let form = new FormData
	let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
	form.append('new-image-url', isUrl ? source : '')
	form.append('new-image', isUrl ? '' : source, 'image.webp')
	let res = await fetch('https://s6.ezgif.com/webp-to-mp4', {
		method: 'POST',
		body: form
	})
	let html = await res.text()
	let { document } = new JSDOM(html).window
	let form2 = new FormData
	let obj = {}
	for (let input of document.querySelectorAll('form input[name]')) {
		obj[input.name] = input.value
		form2.append(input.name, input.value)
	}
	let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, {
		method: 'POST',
		body: form2
	})
	let html2 = await res2.text()
	let { document: document2 } = new JSDOM(html2).window
	return new URL(document2.querySelector('div#output > p.outfile > video > source').src, res2.url).toString()
}

async function webp2png(source) {
	let form = new FormData
	let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
	form.append('new-image-url', isUrl ? source : '')
	form.append('new-image', isUrl ? '' : source, 'image.webp')
	let res = await fetch('https://s6.ezgif.com/webp-to-png', {
		method: 'POST',
		body: form
	})
	let html = await res.text()
	let { document } = new JSDOM(html).window
	let form2 = new FormData
	let obj = {}
	for (let input of document.querySelectorAll('form input[name]')) {
		obj[input.name] = input.value
		form2.append(input.name, input.value)
	}
	let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, {
		method: 'POST',
		body: form2
	})
	let html2 = await res2.text()
	let { document: document2 } = new JSDOM(html2).window
	return new URL(document2.querySelector('div#output > p.outfile > img').src, res2.url).toString()
}

module.exports = {
	toAudio,
	toPTT,
	toVideo,
	ffmpeg,
	convertSticker,
	mp4ToWebp,
	webp2mp4,
	webp2png
}