const book = require('./components/book');
const checkFormBox = require('./components/checkFormBox')
const {App} = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');

let memo = [];
let today = new Date();
book.blocks[3].accessory.initial_date = today.getFullYear() + "-" +  (today.getMonth() + 1) + "-"+ today.getDate();

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
      text: "/bookを実行すれば鍵の管理ができます。"
    }; 
    await client.chat.postMessage(params);
}
//bookコマンド 送信後のメッセージ
const checkMessage = async(place_data,date_data,start_data,finish_data,user_name) =>{
    const user = "@" + user_name
    const prefaceText = "以下の内容で送信しました。入力に間違いがないか確認してください！\nまだプロトタイプなので申し訳ありませんが、入力間違いがありましたら/deleteと打って削除をお願いします(/deleteすら未実装)...\n";
    const contentText = "日時 : " + date_data + "\n場所 : " + place_data + "\n開始時間 : " + start_data + "\n終了時間 : " + finish_data;
    checkFormBox.blocks[0].text.text = prefaceText + contentText;
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

//action集
// bookコマンドの際の各sectionの反応
app.action('add_place', async ({ack,respond,action}) => {
    await ack();
});

app.action('add_date', async ({ack,respond,action}) => {
    await ack();
    
});

app.action('add_start_time', async ({ack,respond,action}) => {
    await ack();
    
});

app.action('add_finish_time', async ({ack,respond,action}) => {
    await ack(); 
});
//checkFormBoxのaciton
app.action('checkFormBox', async ({ack,respond,action}) => {
    await ack(); 
    //DBに追加する。
    respond("送信完了しました!");
});
//bookコマンド modal submit時
app.view('modal_view', async ({ ack, body, view, client }) => {
    await ack();
    var place_data = view["state"]["values"]["block_place"].add_place.selected_option.text.text;
    var date_data = view["state"]["values"]["block_date"].add_date.selected_date;
    var start_data = view["state"]["values"]["block_start_time"].add_start_time.selected_option.text.text;
    var finish_data = view["state"]["values"]["block_finish_time"].add_finish_time.selected_option.text.text;
    memo.push(place_data,date_data,start_data,finish_data);
    console.log(memo);
    checkMessage(place_data,date_data,start_data,finish_data,body.user.name);
});



(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    firstMessage();
})();