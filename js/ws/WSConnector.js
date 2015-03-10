define(function (require) {
    "use strict";

    var Backbone = require("backbone"),
        consts = require("consts");

    function WSConnector(options) {

        this._ws = null;
        this._sockUrl = options.serverUrl.replace("http", "ws") + "/wsock";
    }

    _.extend(WSConnector.prototype, Backbone.Events);

    WSConnector.prototype.connect = function () {

        this._ws = new WebSocket(this._sockUrl);

        this._ws.onopen = _onSocketOpen.bind(this);
        this._ws.onmessage = _onSocketData.bind(this);
        this._ws.onclose = _onSocketClose.bind(this);
    };

    WSConnector.prototype.send = function (msg) {
        this._ws.send(msg);
    };

    WSConnector.prototype.close = function () {
        this._ws.close();
    };

    WSConnector.prototype.getReadyState = function () {
        return this._ws ? this._ws.readyState : consts.SOCKET_STATES.CLOSED;
    };

    function _onSocketOpen() {
        this.trigger("socket-open");
    }

    function _onSocketData(ev) {
        this.trigger("socket-message", ev);
    }

    function _onSocketClose() {
        this.trigger("socket-close");
    }

    return WSConnector;
});