'use strict';

const {createServer} = require('http');
const {SubscriptionServer} = require('subscriptions-transport-ws');
const {execute, subscribe} = require('graphql');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');

module.exports = function(app, schema, opts) {
  const PORT = 3000;
  const subscriptionOpts = opts.subscriptionServer || {};
  const WS_PORT = subscriptionOpts.port || 5000;
  const WS_IP = subscriptionOpts.host || '0.0.0.0';

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `ws://${WS_IP}:${WS_PORT}/`,
  }));

  app.use('/graphql', bodyParser.json(), graphqlExpress(req => ({
    schema,
    rootValue: global,
    graphiql: false,
    context: {
      app,
      req,
    },
  })));

  const server = createServer(app);
  server.listen(PORT, () => {
    SubscriptionServer.create(
      {execute, subscribe, schema},
      {server, path: '/subscriptions'}
    );
    console.log(`GraphQL server running on port ${PORT}.`);
  });


  const disable = subscriptionOpts.disable || false;

  if (disable === true) {
    return;
  }

  const options = subscriptionOpts.options || {};
  const socketOptions = subscriptionOpts.socketOptions || {};

  const websocketServer = createServer((request, response) => {
    response.writeHead(404);
    response.end();
  });

  websocketServer.listen(WS_PORT, () => console.log(
    `Websocket Server is now running on ws://${WS_IP}:${WS_PORT}/`
  ));

  SubscriptionServer.create({schema, execute, subscribe}, {server: websocketServer, path: '/'});

  return server;
};
