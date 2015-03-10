define(function (require) {
    "use strict";

    var Backbone = require("backbone"),
        webSocketsEntity = require("common/webSocketsEntity");

    return webSocketsEntity(Backbone.Collection);
});