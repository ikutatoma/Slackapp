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

//message集
const firstMessage = async() =>{
    const client = new WebClient(token);
    const params = {
      channel: 'keymanagement',
      text: "鍵管理システム,プロトタイプです！「こんなことしてほしい！」「ここが使いずらい」などの意見を教えていただけるとすごく励みになります。\n使い方 : /bookを実行すれば鍵の予約ができます。"
    }; 
    await client.chat.postMessage(params);
}


//bookコマンド 送信後のメッセージ
const checkMessage = async(memo) =>{
    const user = "@" + memo[4];
    const prefaceText = "以下の内容で送信しました。入力に間違いがないか確認してください！\nまだプロトタイプなので申し訳ありませんが、入力間違いがありましたら/deleteと打って削除をお願いします(/deleteすら未実装)...\n";
    const contentText = "\n日時 : " + memo[1] + "\n場所 : " + memo[0] + "\n開始時間 : " + memo[2] + "\n終了時間 : " + memo[3];
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

//userの予約したの選択肢できるJsonを作る
const UserMakeJson = (user_book) => {
    var formerJson = deleteSelect;
    for(var i = 0; i< user_book.length;i++){
        formerJson.blocks[0].element.options[i] = {
            "text":{
                "type":'plain_text',
                "text":'',
                'emoji': true
            },
            "value":''  
        }

        place = user_book[i].place;
        date = user_book[i].date;
        start = user_book[i].start;
        finish = user_book[i].finish;
        docId = user_book[i].id;
        
        formerJson.blocks[0].element.options[i].text.text = "日時 : " + date + "\n" + "場所 : " + place + "\n" + "開始時間 : " +  start + "\n" + "終了時間 : " +  finish + "\n----------------------------";
        formerJson.blocks[0].element.options[i].value = "value-" + docId;
    }
    return deleteSelect;
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
    const user_block = UserMakeJson(user_book);
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
        var date_data = date_cont;
        var start_data = start_cont.text.text;
        var finish_data = finish_cont.text.text;
        memo.push(place_data,date_data,start_data,finish_data,body.user.name);
        sendDb(memo);
    }
});

app.view('delete_view', async ({ ack,body,view}) => {
    ack();   
    var aa = Object.keys(view["state"]["values"]);
    console.log(view["state"]["values"][aa[0]].checkboxesAction.selected_options)
});


(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    firstMessage();
})();