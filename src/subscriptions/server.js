const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');


const websocketServer = createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

module.exports = function(subscriptionManager, opts) {

  const subscriptionOpts = opts.subscriptionServer || {};

  const WS_PORT = subscriptionOpts.port || 5000;
  const options = subscriptionOpts.options || {};
  const socketOptions = subscriptionOpts.socketOptions || {};

  websocketServer.listen(WS_PORT, () => console.log(
    `Websocket Server is now running on http://localhost:${WS_PORT}`
  ));

  const server = new SubscriptionServer(
      Object.assign({}, {
        // onConnect: ({ accessToken }) => {
        //   // Implement if you need to handle and manage connection
        // TODO: Implement authentication, reference blog: https://dev-blog.apollodata.com/new-release-of-graphql-subscriptions-for-javascript-f11be19e6569#.l1yh2y1x1
        // },
        subscriptionManager
      }, options),
      Object.assign({}, {
        server: websocketServer,
        path: '/'
      }, socketOptions)
    );

  return server;
};
