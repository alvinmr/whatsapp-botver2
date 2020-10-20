import { create, Client } from "@open-wa/wa-automate"
import { options } from "../utils/option";
import { color } from "../utils/index"

require('./msgHandler')
noCache('./msgHandler', module => console.log(`'${module} updated!'`))

const start = (client:Client) => {
    console.log('[BOT] SERVER STARTED');

    client.onStateChanged((state) => {
        console.log('CLIENT STATE', state);
        if(state=== "CONFLICT" || state=== "UNLAUNCHED") client.forceRefocus();
        if(state=== 'UNPAIRED') console.log('LOGGED OUT!!!!')
    })

    client.onMessage(async (message) => {
        client.getAmountOfLoadedMessages()
            .then((msg) => {
                if(msg >= 3000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'));
                    client.cutMsgCache()
                }
            })
        require('./msgHandler').msgHandler(client, message)
    })

    client.onAddedToGroup(async (chat) => {
        let totMem = await chat.groupMetadata.participants.length
        if (totMem >= 1) client.sendText(chat.groupMetadata.id, `Halo rakyat grup ${chat.contact.name}  terimakasih sudah menginvite bot ini, untuk melihat menu silahkan kirim *#menu*`)
    })

    client.onIncomingCall(( async (call) => {
        await client.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelpon = block!')
        .then(() => client.contactBlock(call.peerJid))
    }))
}

function noCache(module, cb = (a) => {}){
    console.log('Module', `'${module}'`, 'is now watched for changed')
    require('fs').watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })    
}

function uncache(module = '.'){
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch(e) {
            reject(e)
        }
    })

}
create(options(true, start))
    .then((client) => start(client))
    .catch((err) => new Error(err))
