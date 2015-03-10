define(function (require) {
    "use strict";

    //todo: is there need to use the deferred or can it be removed?
    //todo: need to add a stop listening function

    var _ = require("underscore"),
        $ = require("jquery"),

        BACKBONE_HTTP_METHOD_MAP = {
            "create": "POST",
            "update": "PUT",
            "patch": "PATCH",
            "delete": "DELETE",
            "read": "GET"
        };

    /**
     * provides base functionality for backbone model/collection to work with a web sockets server
     * using socket-drawer or following the same json format
     * @type {*}
     */
    var WebSocketsEntity = {

        listenMethod: "listenToOnce", //by default act like req/res - can set this to listen to push messages
        listenWithId: true,     //by default, use the wsId (if its set on the type) to listen to events from web sockets

        _entityInitialize: function (options) {
            this.vent = options.vent;
        },

        fetch: function (options) {

            options = this._augmentSyncOptions(options);

            return this.__bbType.prototype.fetch.call(this, options);
        },

        _augmentSyncOptions: function (options) {

            var wsId = _.result(this, "wsIdentifier");

            options = options || {};

            options.metadata = _.extend({
                clientRequestId: wsId
            }, options.metadata);

            return options;
        },

        sync: function (method, model, options) {

            var resource = options.url || _.result(model, "url");
            var defr = $.Deferred();
            var requestType = BACKBONE_HTTP_METHOD_MAP[method] || "GET";
            var data = options.data || {};
            var metadata = options.metadata || {};

            if (!resource) {
                throw new Error("WebSocketsEntity - URL not provided");
            }

            if (_.isEmpty(data) && model && (method === "create" || method === "update" || method === "patch")) {
                data = options.attrs || model.toJSON(options);
            }

            defr.done(options.success);
            defr.fail(options.error);

            var listenMethod = options.listenMethod || this.listenMethod;
            var listenWithId = !_.isUndefined(options.listenWithId) ? options.listenWithId : this.listenWithId;
            var listenId = "ws:resource:" + resource;

            this[listenMethod](this.vent, listenId,
                function (respData, clientId) {  //data returned from server

                    if (metadata.clientRequestId && listenWithId && clientId !== metadata.clientRequestId) {
                        return; //only handling responses that have the same id that match the request id
                    }

                    var dfrPending = (defr.state() === "pending");

                    if (respData.isError) {

                        if (dfrPending) { //first time, use the deferred mechanism
                            defr.reject(respData.data);
                        }
                        else {
                            if (_.isFunction(options.error)) {
                                options.error(respData.data);
                            }
                        }
                    }
                    else {
                        if (dfrPending) { //first time, use the deferred mechanism
                            defr.resolve(respData.data);
                        }
                        else {
                            if (_.isFunction(options.success)) {
                                options.success(respData.data);
                            }
                        }
                    }
                });

            if (options.beforeSend){
                options.beforeSend.apply(this, arguments); //just like BB
            }

            this.vent.trigger("ws:send", { //send the 'request' to the server
                resource: resource,
                metadata: metadata,
                method: requestType,
                data: data
            });

            this.trigger("request", this, defr, options); //just like BB

            return defr.promise;   //staying close with Backbone, the BB sync method returns xhr which is a jquery promise object so I do too
        }
    };

    var createEntity = function (backboneType) {

        var entity = {
            constructor: function (data, options) {     //have to define the constructor here so it remains unique and not shared between types calling this create method
                this._entityInitialize(options);
                this.__bbType.prototype.constructor.apply(this, arguments);
            },
            __bbType: backboneType
        };

        entity = _.extend({}, WebSocketsEntity, entity);

        return backboneType.extend(entity);
    };

    return createEntity;
});