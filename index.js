const book = require('./components/book')
const {App} = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
let memo = [];

const app = new App({
    token: "xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim",
    signingSecret: "9a9b592ece65b941f12e58a65130a396"
});

app.event('message', async ({event,client}) => {
    await client.chat.postMessage({
        text: `受け取ったメッセージはこちらです。"${event.text}"`,
        channel: 'keymanagement',
    });

});

const sendMessage = async() =>{
    const client = new WebClient("xoxb-2373497621991-2411908742896-iz21znKQCqtRCCEAi9ExhRim");
    const params = {
      channel: 'keymanagement',
      text: "/bookを実行すれば鍵の管理ができます。"
    }; 
    await client.chat.postMessage(params);
}

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

app.action('datepicker_action', async ({ack,respond,action}) => {
    await ack();
    
});
app.action('add_start_time', async ({ack,respond,action}) => {
    await ack();
    
});
app.action('add_finish_time', async ({ack,respond,action}) => {
    await ack(); 
});


(async () => {
    await app.start(3000);
    console.log("Hello World, thank you for waiting");
    sendMessage();
})();