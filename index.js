const book = require('./components/book')
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

const firstMessage = async() =>{
    const client = new WebClient(token);
    const params = {
      channel: 'keymanagement',
      text: "/bookを実行すれば鍵の管理ができます。"
    }; 
    await client.chat.postMessage(params);
}
//command 
app.command('/book', async ({ack,payload,client}) => {
    await ack();
    await client.views.open({
        trigger_id: payload.trigger_id,
        view:book
    });
});
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

const checkMessage = async(place_data,date_data,start_data,finish_data,user_name) =>{
    const user = "@" + user_name
    const prefaceText = "入力に間違いがないか確認してください！\nまだプロトタイプなので申し訳ありませんが、入力間違いがありましたらもう一度/bookと打ってください...\n";
    const contentText = "日時 : " + date_data + "\n場所 : " + place_data + "\n開始時間 : " + start_data + "\n終了時間 : " + finish_data;
    const client = new WebClient(token);
    const params = {
      channel: user,
      text: prefaceText + contentText
    }; 
    await client.chat.postMessage(params);
}


(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    firstMessage();
})();