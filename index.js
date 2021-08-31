//const book = require('./components/book');
const book = require('./components/book');
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
//最初に見せるメッセージ
const firstMessage = async() =>{
    const client = new WebClient(token);
    const params = {
      channel: 'keymanagement',
      text: "鍵管理システム,プロトタイプです！「こんなことしてほしい！」「ここが使いずらい」などの意見を教えていただけるとすごく励みになります。\n使い方 : /bookを実行すれば鍵の予約ができます。"
    }; 
    await client.chat.postMessage(params);
}

//bookコマンド 送信後のメッセージ
const checkMessage = async(place_data,date_data,start_data,finish_data,user_name) =>{
    const user = "@" + user_name
    const prefaceText = "以下の内容で送信しました。入力に間違いがないか確認してください！\nまだプロトタイプなので申し訳ありませんが、入力間違いがありましたら/deleteと打って削除をお願いします(/deleteすら未実装)...\n";
    const contentText = "\n日時 : " + date_data + "\n場所 : " + place_data + "\n開始時間 : " + start_data + "\n終了時間 : " + finish_data;
    const client = new WebClient(token);
    var params = {
      channel: user,
      text:prefaceText + contentText
    };
    await client.chat.postMessage(params);
}

//command集
app.command('/book', async ({ack,payload,client}) => {
    await ack();
    await client.views.open({
        trigger_id: payload.trigger_id,
        view:book
    });
});

//bookコマンド modal submit時

app.view('modal_view', async ({ ack, body, view}) => {
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
        memo.push(place_data,date_data,start_data,finish_data);
        checkMessage(place_data,date_data,start_data,finish_data,body.user.name);
    }
});

(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    firstMessage();
})();