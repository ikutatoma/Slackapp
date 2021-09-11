//DBの設定
const admin = require("firebase-admin");
const serviceAccount = require("./slackapp-94a6a-firebase-adminsdk-2bkmx-62333c78f8.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackapp-94a6a-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.firestore();

//ここからslackApp
const book = require('./components/book');
const checkBox = require('./components/checkBox');
const deleteSelect = require('./components/deleteSelect')
const {App} = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
let memo = [];
let today = new Date();
book.blocks[2].element.initial_date = today.getFullYear() + "-" +  (today.getMonth() + 1) + "-"+ today.getDate();

const token = "xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim";
const signingSecret = "9a9b592ece65b941f12e58a65130a396";
const app = new App({
    token: token,
    signingSecret:signingSecret,
}); 

//始めに見せるメッセージ
const firstMessage = async() =>{
    const client = new WebClient(token);
    const params = {
      channel: 'keymanagement',
      text: "鍵管理システムです！「こんなことしてほしい！」「ここが使いずらい」などの意見を教えていただけるとすごく励みになります。\n\n-------------------------使い方----------------------------\n\n/bookを実行すれば鍵の予約ができます。\n\n/deleteを実行すれば鍵の予約を削除できます。\n\n/mykeysを実行すればあなたが今予約している鍵の一覧が取得できます。\n\n/keysを実行すれば全てのuserの今予約されている鍵の一覧が取得できます。"
    }; 
    await client.chat.postMessage(params);
}

//bookコマンド 送信後のメッセージ
const checkMessage = async(memo) =>{
    const user = "@" + memo[4];
    const sendDate = new Date(memo[1].getTime());
    const prefaceText = "以下の内容で送信しました。入力に間違いがないか確認してください！\nまだプロトタイプなので申し訳ありませんが、入力間違いがありましたら/deleteと打って削除をお願いします\n";
    const contentText = "\n------------予約内容------------\n\n日時 : " + dateToString(sendDate) + "\n\n場所 : " + memo[0] + "\n\n開始時間 : " + memo[2] + "\n\n終了時間 : " + memo[3];
    const client = new WebClient(token);
    var params = {
      channel: user,
      text:prefaceText + contentText
    };
    await client.chat.postMessage(params);
}

//DBに送信
const sendDb = content =>{
    var place = content[0]
    var date = content[1]
    var start = content[2]
    var finish = content[3]
    var sendUser = content[4]

    db.collection('book').add({
        "place": place,
        "date": date,
        "start": start,
        "finish":finish,
        "user":sendUser
      });
    checkMessage(content);
}

//Date型を文字列にする。
const dateToString = (date) =>{
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var date = date.getDate();
    return year + "-" + month + "-" + date
}

//Bookを日付順(昇順)にソートする。
const dateAscOrder = (book) =>{
    book.sort(function(a,b){
        if(a.date._seconds>b.date._seconds) return -1;
        if(a.date._seconds < b.date._seconds) return 1;
        return 0;
    });
    return book
}

//userの予約したの選択肢できるJsonを作る(delete用)
const UserBookDeleteJson = (user_book) => {
    const formerJson = deleteSelect;
    let indCount = 0;
    let todayUni  = Math.floor(today.getTime() / 1000);
    for(var i = 0; i< user_book.length;i++){   
        var dataUni = user_book[i].date._seconds;

        if( dataUni >= todayUni){
            formerJson.blocks[0].element.options[indCount] = {
                "text":{
                    "type":'plain_text',
                    "text":'',
                    'emoji': true
                },
                "value":'',
            }
            place = user_book[i].place;
            date = new Date(dataUni*1000);
            start = user_book[i].start;
            finish = user_book[i].finish;
            docId = user_book[i].id;

            dateStr = dateToString(date);
            
            formerJson.blocks[0].element.options[indCount].text.text = "日時 : " + dateStr + "\n" + "場所 : " + place + "\n" + "開始時間 : " +  start + "\n" + "終了時間 : " +  finish + "\n----------------------------";
            formerJson.blocks[0].element.options[indCount].value = docId;
            indCount++;
        }
    }
    return formerJson;
}

//command集
app.command('/book', async ({ack,payload,client}) => {
    await ack();
    await client.views.open({
        trigger_id: payload.trigger_id,
        view:book
    });
});

app.command('/delete', async({ack,respond,body,client,payload}) => {
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
        view:user_block
    });
});

//bookコマンド modal submit時
app.view('modal_view', async ({ ack, body, view}) => {
    memo = [];
    var place_cont= view["state"]["values"]["block_place"]["add_place"].selected_option;
    var date_cont= view["state"]["values"]["block_date"]["add_date"].selected_date;
    var start_cont= view["state"]["values"]["block_start_time"]["add_start_time"].selected_option;
    var finish_cont= view["state"]["values"]["block_finish_time"]["add_finish_time"].selected_option;
    if(place_cont == null || date_cont == null || start_cont == null || finish_cont == null) { 
        ack(
            {
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
        var place_data = place_cont.text.text;
        var date_data = new Date(date_cont);
        var start_data = start_cont.text.text;
        var finish_data = finish_cont.text.text;
        memo.push(place_data,date_data,start_data,finish_data,body.user.name);
        sendDb(memo);
    }
});
//deleteコマンド modal submit時
app.view('delete_view', async ({ ack,body,view}) => {
    ack();   
    var obKeys = Object.keys(view["state"]["values"]);
    deleDatas = view["state"]["values"][obKeys[0]].checkboxesAction.selected_options;
    for(var i =0 ;i < deleDatas.length;i++){
        var dataDoc = deleDatas[i].value
        await db.collection('book').doc(dataDoc).delete();
    }
});


(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    firstMessage();
})();