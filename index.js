const book = require('./components/book')
const {App} = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');

let memo = [];
let today = new Date();
book.blocks[3].accessory.initial_date = today.getFullYear() + "-" +  (today.getMonth() + 1) + "-"+ today.getDate()

const app = new App({
    token: "xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim",
    signingSecret: "9a9b592ece65b941f12e58a65130a396"
});

const sendMessage = async() =>{
    const client = new WebClient("xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim");
    const params = {
      channel: 'keymanagement',
      text: "/bookを実行すれば鍵の管理ができます。"
    }; 
    await client.chat.postMessage(params);
}

app.event('message', async ({event,client}) => {
    await client.chat.postMessage({
        text: `受け取ったメッセージはこちらです。"${event.text}"`,
        channel: 'keymanagement',
    });
});

app.command('/book', async ({ack,payload,client}) => {
    await ack();
    await client.views.open({
        trigger_id: payload.trigger_id,
        view:book
    });
});

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

app.view('modal_view', async ({ ack, body, view, client }) => {
    await ack();
    var place_data = view["state"]["values"]["block_place"].add_place.selected_option.text.text;
    var date_data = view["state"]["values"]["block_date"].add_date.selected_date;
    var start_data = view["state"]["values"]["block_start_time"].add_start_time.selected_option.text.text;
    var finish_data = view["state"]["values"]["block_finish_time"].add_finish_time.selected_option.text.text;
    memo.push(place_data,date_data,start_data,finish_data);
    console.log(memo);
});

(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    sendMessage();
})();