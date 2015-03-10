define(function (require) {
    "use strict";

    var _ = require("underscore"),
        Backbone = require("backbone"),
        webSocketsEntity = require("common/WebSocketsEntity");

    var WebSocketModel = Backbone.Model.extend({

        save: function () {

            var optsIdx = -1; //options par can either be second or third (not first) in backbone model save
            var args = Array.prototype.slice.call(arguments);

            if (args.length === 0) {
                //throw new Error("WebSocketModel - you shouldn't invoke model.save without any parameters");
                args[0] = null;
                args[1] = this._augmentSyncOptions();
            }
            else if (args.length === 1 || (args.length === 2 && _.isObject(args[1]))) {
                optsIdx = 1;
            }
            else {
                optsIdx = 2; //use as the third par even if options wasnt provided
            }

            if (optsIdx > 0) {
                args[optsIdx] = this._augmentSyncOptions(args[optsIdx]);
            }

            return Backbone.Model.prototype.save.apply(this, args);
        }
    });

    WebSocketModel = webSocketsEntity(WebSocketModel);

    return WebSocketModel;
});