//DBの設定

const admin = require("firebase-admin");
const serviceAccount = require("./slackapp-94a6a-firebase-adminsdk-2bkmx-62333c78f8.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackapp-94a6a-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.firestore();

const book = require('./components/book');
const plainJson = require('./components/plain');
const deleteSelect = require('./components/deleteSelect')
const {
    App
} = require('@slack/bolt');
const {
    WebClient
} = require('@slack/web-api');
let memo = [];
let today = new Date();
book.blocks[2].element.initial_date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

const token = "xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim";
const signingSecret = "9a9b592ece65b941f12e58a65130a396";
const app = new App({
    token: token,
    signingSecret: signingSecret,
});

//始めに見せるメッセージ
const firstMessage = async () => {
    const client = new WebClient(token);
    const params = {
        channel: 'keymanagement',
        text: "鍵管理システムです！「こんなことしてほしい！」「ここが使いずらい」などの意見を教えていただけるとすごく励みになります。\n\n-------------------------使い方----------------------------\n\n/bookを実行すれば鍵の予約ができます。\n\n/deleteを実行すれば鍵の予約を削除できます。\n\n/mykeysを実行すればあなたが今予約している鍵の一覧が取得できます。\n\n/keysを実行すれば全てのuserの今予約されている鍵の一覧が取得できます。"
    };
    await client.chat.postMessage(params);
}

//bookコマンド 送信後のメッセージ
const checkMessage = async (memo) => {
    const user = "@" + memo[4];
    const sendDate = new Date(memo[1].getTime());
    const prefaceText = "以下の内容で送信しました。入力に間違いがないか確認してください！\nまだプロトタイプなので申し訳ありませんが、入力間違いがありましたら/deleteと打って削除をお願いします\n";
    const contentText = "\n------------予約内容------------\n\n日時 : " + dateToString(sendDate) + "\n\n場所 : " + memo[0] + "\n\n開始時間 : " + memo[2] + "\n\n終了時間 : " + memo[3];
    const client = new WebClient(token);
    var params = {
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

//command集
app.command('/book', async ({
    ack,
    payload,
    client
}) => {
    await ack();
    await client.views.open({
        trigger_id: payload.trigger_id,
        view: book
    });
});

app.command('/delete', async ({
    ack,
    respond,
    body,
    client,
    payload
}) => {
    await ack();
    var user_book = [];
    await db.collection('book').where('user', '==', body.user_name).get()
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

app.command('/all-keys', async ({
    ack,
    body,
    client,
    payload,
    respond
}) => {
    await ack();
    var all_user_book = [];
    await db.collection('book').get()
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

app.command('/my-keys', async ({
    ack,
    body,
    client,
    payload,
    respond
}) => {
    await ack();
    var user_book = [];
    await db.collection('book').where('user', '==', body.user_name).get()
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

//bookコマンド modal submit時
app.view('modal_view', async ({
    ack,
    body,
    view
}) => {
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

        db.collection('book').add({
            "place": place_data,
            "date": date_data,
            "start": start_data,
            "finish": finish_data,
            "user": body.user.name
        });
        checkMessage(memo);
    }
});
//deleteコマンド modal submit時
app.view('delete_view', async ({
    ack,
    body,
    view
}) => {
    ack();
    var obKeys = Object.keys(view["state"]["values"]);
    deleDatas = view["state"]["values"][obKeys[0]].checkboxesAction.selected_options;
    for (var i = 0; i < deleDatas.length; i++) {
        var dataDoc = deleDatas[i].value
        await db.collection('book').doc(dataDoc).delete();
    }
});

