'use strict';

const _ = require('lodash');

const promisify = require('promisify-node');
const checkAccess = require("../ACLs");
const utils = require('../utils');
const {connectionFromPromisedArray} = require('graphql-relay');
const allowedVerbs = ['get', 'head'];
const defaultFindMethods = ['find'];

module.exports = function getRemoteMethodQueries(model) {
  const hooks = {};

  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().forEach((method) => {
      if (method.shared && method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {
        if (!utils.isRemoteMethodAllowed(method, allowedVerbs)) {
          return;
        }

        // TODO: Add support for static methods
        if (method.isStatic === false) {
          return;
        }

        const typeObj = utils.getRemoteMethodOutput(method);

        const acceptingParams = utils.getRemoteMethodInput(method, typeObj.list);
        const hookName = utils.getRemoteMethodQueryName(model, method);

        hooks[hookName] = {
          name: hookName,
          description: method.description,
          meta: {relation: true},
          args: acceptingParams,
          type: typeObj.type,
          resolve: (__, args, context, info) => {
            let params = [];

            _.forEach(acceptingParams, (param, name) => {
              params.push(args[name]);
            });
          var modelId = args && args.id;
         return checkAccess({accessToken:context.req.accessToken ,model: model, method: method,id:modelId})
            .then(() =>{
              const wrap = promisify(model[method.name]);

              if (typeObj.list) {
                if (defaultFindMethods.indexOf(method.name) == -1 && method.returns[0].type.indexOf('any') != -1) {
                  params = [];
                  _.forEach(method.accepts, (accept, index) => {
                    params.push(args[accept.arg]);
                  });
                }

                return connectionFromPromisedArray(wrap.apply(model, params), args, model);
              }

              return wrap.apply(model, params);
            })
            .catch((err)=>{               
                 throw  err;
            }); 
          },
        };
      }
    });
  }

  return hooks;
};
