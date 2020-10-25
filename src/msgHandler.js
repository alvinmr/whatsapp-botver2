const { addFilter, color, isFiltered, processTime, isUrl } =  require('../utils/index.js')
const { trans } =  require("../utils/translate.js")
const moment = require('moment-timezone')
const { decryptMedia } = require('@open-wa/wa-automate')
const axios =  require('axios')
const Text = require('../libs/texts/id.js')
const cheerio = require('cheerio')
const request = require('request')



moment.tz.setDefault('Asia/Makassar').locale('id')

const msgHandler = async (client, message) => {
    try {
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        const { name, formattedTitle } = chat
        let { pushname } = sender
        const commands = caption || body || ''
        const command = commands.toLowerCase().split(' ')[0] || ''
        const args =  commands.split(' ')

        const msgs = (message) => {
            if (!command.startsWith('#')) return 'Message'
            if (message.length >= 10){
                return `${message.substr(0, 15)}`
            }else{
                return `${message}`
            }
        }

        const mess = {
            wait: '[ WAIT ] Sedang di proses⏳ silahkan tunggu sebentar',
            error: {
                St: '[ ERROR ] Kirim gambar dengan caption *#sticker* atau tag gambar yang sudah dikirim',
                Qm: '[ ERROR ] Terjadi kesalahan, mungkin themenya tidak tersedia!',
                Yt3: '[ ERROR ] Terjadi kesalahan, tidak dapat meng konversi ke mp3!',
                Yt4: '[ ERROR ] Terjadi kesalahan, mungkin error di sebabkan oleh sistem.',
                Ig: '[ ERROR ] Terjadi kesalahan, mungkin karena akunnya private',
                Ki: '[ ERROR ] Bot tidak bisa mengeluarkan admin group!',
                Ad: '[ ERROR ] Tidak dapat menambahkan target, mungkin karena di private',
                Iv: '[ ERROR ] Link yang anda kirim tidak valid!'
            }
        }

        const time = moment(t * 1000).format('DD/MM HH:mm:ss')
        const botNumber = await client.getHostNumber()
        const blockNumber = await client.getBlockedIds()
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false
        const isBotGroupAdmins = isGroupMsg ? groupAdmins.includes(botNumber + '@c.us') : false
        const ownerNumber = '6289670455568@c.us'
        const isOwner = sender.id === ownerNumber
        const isBlocked = blockNumber.includes(sender.id) === true
        const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'                
        if (!isGroupMsg) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mMSG\x1b[1;37m]', time, color(msgs(command)), 'from', color(pushname))
        if (isGroupMsg) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mMSG\x1b[1;37m]', time, color(msgs(command)), 'from', color(pushname), 'in', color(name || formattedTitle))
        if (isBlocked) return

        // Handle Spam message
        // if (isCmd && isFiltered(from) && !isGroupMsg) return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        // if (isCmd && isFiltered(from) && isGroupMsg) return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname),'in', color(name || formattedTitle))
        
        // if (!isCmd && !isGroupMsg) return console.log('[RECV]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Message from', color(pushname)) 
        // if (!isCmd && isGroupMsg) return console.log('[RECV]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Message from', color(pushname), 'in', color(name || formattedTitle)) 
        // if (isCmd && !isGroupMsg) console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) 
        // if (isCmd && isGroupMsg) console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) 

        // addFilter(from)

        switch (command) {
            case '#help':
            case '#menu':
                await client.reply(from, Text.textMenu(pushname), id)
                if (isGroupAdmins) return await client.sendText(from, Text.textAdmin)
                break;
            case '#speed':
            case '#pings':
                await client.reply(from, `Pong!!!!\nSpeed: ${processTime(t, moment())} s`, id)
                break;
            case '#bc':
                if(!isOwner) return await client.reply(from, 'ogah kau bukan yang buat bot ini', id)
                let msg = body.slice(4)
                const allChat = await client.getAllChatIds()
                for (let ids of allChat){
                    var idc = await client.getChatById(ids)
                    if(!idc.isReadOnly) await client.sendText(ids, `-BROADCAST BOT-\n\n${msg}`)
                }
                break;
            case '#sticker' :
            case '#stiker' :
                if (isMedia && type === 'image') {
                    const mediaData = await decryptMedia(message, uaOverride)
                    const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64)
                } else if (quotedMsg && quotedMsg.type == 'image') {
                    const mediaData = await decryptMedia(quotedMsg, uaOverride)
                    const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64)
                } else if (args.length === 2) {
                    const url = args[1]
                    if (isUrl(url)) {
                        await client.sendStickerfromUrl(from, url, { method: 'get' })
                            .catch(err => console.log('Caught exception: ', err))
                    } else {
                        await client.reply(from, mess.error.Iv, id)
                    }
                } else {
                        await client.reply(from, mess.error.St, id)
                }
                break;

            case '#stikergif':
            case '#stickergif':
            case '#gifstiker':
            case '#gifsticker': 
                if (args.length === 1) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
                const url = body.slice(11)
                const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'))
                const isMediaGiphy = url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
                if (isGiphy) {
                    const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                    if (!getGiphyCode) { return client.reply(from, 'Gagal mengambil kode giphy', id) }
                    const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                    const smallGifUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                    await client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                        client.sendText(from, 'Here\'s your sticker')
                        console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                    }).catch((err) => console.log(err))
                } else if (isMediaGiphy) {
                    const gifUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                    if (!gifUrl) { return client.reply(from, 'Gagal mengambil kode giphy', id) }
                    const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
                    client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                        client.sendText(from, 'Here\'s your sticker')
                        console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                    }).catch((err) => console.log(err))
                } else {
                    await client.reply(from, 'maaf, untuk saat ini sticker gif hanya bisa menggunakan link dari giphy.  [Giphy Only]', id)
                }
                break;
                    

            case '#translate' :
            case '#tr':
                if (args.length === 1) return await client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
                if (!quotedMsg) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
                const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''                                ;
                trans(quoteText, args[1])
                    .then((result) => client.reply(from, `${quoteText} => ${result}`, quotedMsg.chatId))
                    .catch(() => client.reply(from, 'Error, Kode bahasa salah.', id))
                break

            case '#bosen' :
            case '#gabut' :
                const boredText = await axios.get('http://www.boredapi.com/api/activity/')
                trans(boredText.data.activity, 'id')
                    .then((result) => client.reply(from, `Coba ${result.toLowerCase()}`, id))
                    .catch((err) => console.log(err) )
                break;

            case '#apakah' :
                const apakah = require('node-gtts')('id')
                const answer = ['iya', 'tidak', 'mungkin', 'coba tanya lagi']
                if (args .length === 1) return await client.reply(from, 'apakah apa babi, yang jelas napa', id)
                let randomAnsw = Math.floor(Math.random() * answer.length)
                apakah.save('./libs/tts/resID.mp3', answer[randomAnsw], () => {
                    client.sendPtt(from, './libs/tts/resID.mp3', id)
                })
                break;

            case '#berapakah' :
                await client.reply(from, `babi kau ${pushname}`, id)
                break;

            case '#artinama' :
            case '#arti' :
                if (args.length === 1) return await client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)                
                const nama = body.slice(6)

                request.get({
                    headers: {'content-type' : 'application/x-www-form-urlencoded'},
                    url:     'http://www.primbon.com/arti_nama.php?nama1='+ nama +'&proses=+Submit%21+',
                }, async (error, response, body) => {
                    let $ = cheerio.load(body);
                    var y = $.html().split('arti:')[1];
                    var t = y.split('method="get">')[1];
                    var f = y.replace(t ," ");
                    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
                    var h  = x.replace(/<[^>]*>?/gm, '');
                    await client.reply(from, `Nama : *${nama}* \nMemiliki arti : ${h}`, id)
                })
                break;

            case '#kecocokan' :
                if (args.length === 1) return await client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)                
                if (args[2] !== '|') return await client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
                const nama1 = args[1]
                const nama2 = args[3]
                request.get({
                    headers: {'content-type' : 'application/x-www-form-urlencoded'},
                    url:     'http://www.primbon.com/kecocokan_nama_pasangan.php?nama1='+ nama1 +'&nama2='+ nama2 +'&proses=+Submit%21+',
                }, async (error, response, body) => {
                    let $ = cheerio.load(body);
                    var y = $.html().split('<b>KECOCOKAN JODOH BERDASARKAN NAMA PASANGAN</b><br><br>')[1];
                    var t = y.split('.<br><br>')[1];
                    var f = y.replace(t ," ");
                    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
                    var h  = x.replace(/<[^>]*>?/gm, '');
                    var d = h.replace("&amp;", '&')
                    await client.reply(from, `${d}`, id)
                })
                break;
                    

            case '#wiki': 
                if (args.length === 1) return await client.reply(from, 'kirim perintah *#wiki*\ncontoh : #wiki babi', id)
                const query = body.slice(6)
                axios.post(`https://id.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${query}`)
                    .then(async (res) => {
                        const qAwal = res.data.query.pages
                        const value = Object.values(qAwal)  
                        value ? await client.reply(from, value, id) : await client.reply(from, 'wah maaf ga nemu nih di wiki')
                        
                    })
                    .catch(async (err) => {
                        await client.reply(from, 'kayanya ada yang salah deh')
                    })
                break;

            case '#say':
                if(args.length === 1) return await client.reply(from, 'Kirim perintah *#say* [id, en, jp, ar] [teks],\ncontoh *#say* id halo anak babi', id)
                const ttsId = require('node-gtts')('id')
                const ttsEn = require('node-gtts')('en')
                const ttsJp = require('node-gtts')('ja')
                const ttsAr = require('node-gtts')('ar')
                const dataText = body.slice(8)
                if (dataText === '') return await client.reply(from, 'bodoh kh?', id)
                let totalText = Number(dataText.split(' ').length) - Number(dataText.length)
                if (totalText >= 250) return await client.reply(from, 'jangan kebanyakan babi', id)
                let dataBahasa = body .slice(5, 7)
                if (dataBahasa == 'id') {    
                    ttsId.save('./libs/tts/resID.mp3', dataText, () => {
                        client.sendPtt(from, './libs/tts/resID.mp3', id)
                    })                                         
                } else if (dataBahasa == 'en') {
                    ttsEn.save('./libs/tts/resEN.mp3', dataText, () => {
                        client.sendPtt(from, './libs/tts/resEN.mp3', id)
                    }) 
                }
                else if (dataBahasa == 'jp') {
                    ttsJp.save('./libs/tts/resJP.mp3', dataText, () => {
                        client.sendPtt(from, './libs/tts/resJP.mp3', id)
                    }) 
                }
                else if (dataBahasa == 'ar') {
                    ttsAr.save('./libs/tts/resAR.mp3', dataText, () => {
                        client.sendPtt(from, './libs/tts/resAR.mp3', id)
                    }) 
                } else {
                    await client.reply(from, 'Masukkan data bahasa : [id] untuk indonesia, [en] untuk inggris, [jp] untuk jepang, dan [ar] untuk arab', id)
                }
                break;

            case '#tagall':
                if (!isGroupMsg) return await client.reply(from, 'Perintah ini cuma bisa dipake dalam group!', id)
                if (!isGroupAdmins || !isOwner) return await client.reply(from, 'Perintah ini cuma bisa dipake sama admin!', id)
                const grupMem = await client.getGroupMembers(groupId)                
                let tag = `-Tag All-\n`
                let idMem
                for (let i = 0; i < grupMem.length; i++){
                    idMem = grupMem[i].id
                    tag += `@${idMem.replace(/@c.us/g, '')}\n`                                    
                }                
                await client.sendTextWithMentions(from, tag)
                break;
        
            default:
                break;
        }
        
        
    } catch (error) {
        console.log(color('[ERROR]', 'red'), error);
        
    }
}

module.exports = msgHandler