define(function (require) {
    "use strict";

    var SockJS = require("sockjs"),
        Backbone = require("backbone"),
        consts = require("consts");

    function SockjsConnector(options) {

        this._sockjs = null;
        this._sockUrl = options.serverUrl + "/wsock";
    }

    _.extend(SockjsConnector.prototype, Backbone.Events);

    SockjsConnector.prototype.connect = function () {

        this._sockjs = new SockJS(this._sockUrl);

        this._sockjs.onopen = _onSocketOpen.bind(this);
        this._sockjs.onmessage = _onSocketData.bind(this);
        this._sockjs.onclose = _onSocketClose.bind(this);
    };

    SockjsConnector.prototype.send = function (msg) {
        this._sockjs.send(msg);
    };

    SockjsConnector.prototype.close = function () {
        this._sockjs.close();
    };

    SockjsConnector.prototype.getReadyState = function () {
        return this._sockjs ? this._sockjs.readyState : consts.SOCKET_STATES.CLOSED;
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

    return SockjsConnector;
});