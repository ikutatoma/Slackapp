const functions = require('firebase-functions')
const admin = require("firebase-admin");
const serviceAccount = require("./servicekey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackapp-94a6a-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const db = admin.firestore();

const {App,ExpressReceiver} = require('@slack/bolt');
const {WebClient} = require('@slack/web-api');
const token = "xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim";
const book = require('./components/book');
const plainJson = require('./components/plain');
const deleteSelect = require('./components/deleteSelect');
const signingSecret = "9a9b592ece65b941f12e58a65130a396";
const expressReceiver = new ExpressReceiver({
    signingSecret: signingSecret,
    endpoints: '/events',
    processBeforeResponse: true
});
const app = new App({
    receiver: expressReceiver,
    token: token,
    processBeforeResponse: true
});

let memo = [];
const today = new Date();
book.blocks[2].element.initial_date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
//送信内容を表示する。
const checkMessage = async (memo) => {
    const user = "@" + memo[4];
    const sendDate = new Date(memo[1].getTime());
    const prefaceText = "以下の内容で送信しました。入力に間違いがないか確認してください！\n入力間違いがありましたら/deleteを実行して削除をお願いします\n";
    const contentText = "\n------------予約内容------------\n\n日時 : " + dateToString(sendDate) + "\n\n場所 : " + memo[0] + "\n\n開始時間 : " + memo[2] + "\n\n終了時間 : " + memo[3];
    const client = new WebClient(token);
    const params = {
        channel: user,
        text: prefaceText + contentText
    };
    await client.chat.postMessage(params);
}
//Date型を文字列にする。
const dateToString = (date) => {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var date = date.getDate();
    return year + "-" + month + "-" + date
}
//keyを日付順(昇順)にソートする。
const dateAscOrder = (book) => {
    book.sort(function (a, b) {
        if (a.date._seconds > b.date._seconds) return -1;
        if (a.date._seconds < b.date._seconds) return 1;
        return 0;
    });
    return book
}
//削除用keyを選択できるJson
const UserBookDeleteJson = (user_book) => {
    const formerJson = deleteSelect;
    let indCount = 0;
    let todayUni = Math.floor(today.getTime() / 1000);
    for (var i = 0; i < user_book.length; i++) {
        var dataUni = user_book[i].date._seconds;

        if (dataUni >= todayUni) {
            formerJson.blocks[0].element.options[indCount] = {
                "text": {
                    "type": 'plain_text',
                    "text": '',
                    'emoji': true
                },
                "value": '',
            }
            let place = user_book[i].place;
            let date = new Date(dataUni * 1000);
            let start = user_book[i].start;
            let finish = user_book[i].finish;
            let docId = user_book[i].id;

            let dateStr = dateToString(date);

            formerJson.blocks[0].element.options[indCount].text.text = "日時 : " + dateStr + "\n" + "場所 : " + place + "\n" + "開始時間 : " + start + "\n" + "終了時間 : " + finish + "\n----------------------------";
            formerJson.blocks[0].element.options[indCount].value = docId;
            indCount++;
        }
    }
    return formerJson;
}
//全userが予約したkeyを表示するJson
const AllBookShowJson = (user_book) => {
    const showBook = plainJson;
    showBook.blocks[0].text.text = "予約されている全ての鍵はこちらになります！";
    let indCount = 1;
    let todayUni = Math.floor(today.getTime() / 1000);
    for (var i = 0; i < user_book.length; i++) {
        var dataUni = user_book[i].date._seconds;
        if (dataUni >= todayUni) {
            showBook.blocks[indCount] = {
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": "",
                    "emoji": true
                }
            }

            let place = user_book[i].place;
            let date = new Date(dataUni * 1000);
            let start = user_book[i].start;
            let finish = user_book[i].finish;
            let userId = user_book[0].user

            let dateStr = dateToString(date);

            showBook.blocks[indCount].text.text = "日時 : " + dateStr + "\n場所 : " + place + "\n開始時間 : " + start + "\n終了時間 : " + finish + "\n予約したユーザー : " + userId + "\n----------------------------";

            indCount++;
        }
    }
    return showBook;
}
//mykeysコマンドを実行したユーザーのkeyを表示
const UserBookShowJson = (user_book) => {
    const showBook = plainJson;
    showBook.blocks[0].text.text = "あなたが予約している鍵はこちらになります！";
    let indCount = 1;
    let todayUni = Math.floor(today.getTime() / 1000);
    for (var i = 0; i < user_book.length; i++) {
        var dataUni = user_book[i].date._seconds;
        if (dataUni >= todayUni) {
            showBook.blocks[indCount] = {
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": "",
                    "emoji": true
                }
            }

            let place = user_book[i].place;
            let date = new Date(dataUni * 1000);
            let start = user_book[i].start;
            let finish = user_book[i].finish;

            let dateStr = dateToString(date);

            showBook.blocks[indCount].text.text = "日時 : " + dateStr + "\n場所 : " + place + "\n開始時間 : " + start + "\n終了時間 : " + finish + "\n----------------------------";
            indCount++;
        }
    }
    return showBook;
}
app.command('/book', async ({ack,payload,client,respond}) => {
    await ack();  
    await client.views.open({
        trigger_id: payload.trigger_id,
        view: book
    });
});
app.view('modal_view', async ({ack,body,view}) => {
    memo = [];
    const place_cont = view["state"]["values"]["block_place"]["add_place"].selected_option;
    const date_cont = view["state"]["values"]["block_date"]["add_date"].selected_date;
    const start_cont = view["state"]["values"]["block_start_time"]["add_start_time"].selected_option;
    const finish_cont = view["state"]["values"]["block_finish_time"]["add_finish_time"].selected_option;
    if (place_cont == null || date_cont == null || start_cont == null || finish_cont == null) {
        ack({
            "response_action": "errors",
            "errors": {
                "block_place": "error message",
                "block_date": "error message",
                "block_start_time": "error message",
                "block_finish_time": "error message",
            }
        });
    } else {
        ack();
        const place_data = place_cont.text.text;
        const date_data = new Date(date_cont);
        const start_data = start_cont.text.text;
        const finish_data = finish_cont.text.text;
        memo.push(place_data, date_data, start_data, finish_data, body.user.name);
        
        const ref = admin.firestore().collection('book');
        ref.add({
            "place": place_data,
            "date": date_data,
            "start": start_data,
            "finish": finish_data,
            "user": body.user.name
        });
        
        checkMessage(memo);
    }
});
app.command('/delete', async ({ack,respond,body,client,payload}) => {
    await ack();
    var user_book = [];
    const ref = admin.firestore().collection('book');
    await ref.where('user', '==', body.user_name).get()
        .then((res) => {
            res.forEach((doc) => {
                var data = doc.data();
                data.id = doc.id
                user_book.push(data);
            });
        });
    const sortUserBook = dateAscOrder(user_book);
    const user_block = UserBookDeleteJson(sortUserBook);
    await client.views.open({
        trigger_id: payload.trigger_id,
        view: user_block
    });
});
app.view('delete_view', async ({ack,body,view}) => {
    ack();
    var obKeys = Object.keys(view["state"]["values"]);
    deleDatas = view["state"]["values"][obKeys[0]].checkboxesAction.selected_options;
    for (var i = 0; i < deleDatas.length; i++) {
        var dataDoc = deleDatas[i].value
        await db.collection('book').doc(dataDoc).delete();
    }
});
app.command('/all-keys', async ({ack,body,client,payload,respond}) => {
    await ack();
    var all_user_book = [];
    const ref = admin.firestore().collection('book');
    await ref.get()
        .then((res) => {
            res.forEach((doc) => {
                var data = doc.data();
                data.id = doc.id
                all_user_book.push(data);
            });
        });
    const sortUserBook = dateAscOrder(all_user_book);
    const all_block = AllBookShowJson(sortUserBook);
    await respond({
        response_type: 'in_channel',
        blocks: all_block.blocks
    })
});
app.command('/my-keys', async ({ack,body,client,payload,respond}) => {
    await ack();
    var user_book = [];
    const ref = admin.firestore().collection('book');
    await ref.where('user', '==', body.user_name).get()
        .then((res) => {
            res.forEach((doc) => {
                var data = doc.data();
                data.id = doc.id
                user_book.push(data);
            });
        });
    const sortUserBook = dateAscOrder(user_book);
    const user_block = UserBookShowJson(sortUserBook);
    await respond({
        response_type: 'in_channel',
        blocks: user_block.blocks
    })
});
app.message('key-management-start', async({client}) => {
    await client.chat.postMessage({
        text: "鍵管理システムです！\n\n-------------------------使い方----------------------------\n\n/bookを実行すれば鍵の予約ができます。\n\n/deleteを実行すれば鍵の予約を削除できます。\n\n/mykeysを実行すればあなたが今予約している鍵の一覧が取得できます。\n\n/keysを実行すれば全てのuserの今予約されている鍵の一覧が取得できます。",
        channel: 'keymanagement',
      });
});

exports.slack = functions.https.onRequest(expressReceiver.app);
