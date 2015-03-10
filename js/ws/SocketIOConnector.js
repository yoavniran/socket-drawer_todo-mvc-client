define(function (require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        io = require("socketio"),
        consts = require("consts");

    function SocketIOConnector(options) {

        this._ws = null;
        this._sockUrl = options.serverUrl + "/"; //+ "/wsock"; // .replace("http", "ws")
    }

    _.extend(SocketIOConnector.prototype, Backbone.Events);

    SocketIOConnector.prototype.connect = function () {

        this._ws = io(this._sockUrl, {forceJSONP: true, path: "/wsock"});  //new WebSocket(this._sockUrl);

        this._ws.on("connect", _onSocketOpen.bind(this));
        this._ws.on("message", _onSocketData.bind(this));
        this._ws.on("disconnect", _onSocketClose.bind(this));
    };

    SocketIOConnector.prototype.send = function (msg) {
        this._ws.send(msg);
    };

    SocketIOConnector.prototype.close = function () {
        this._ws.close();
    };

    SocketIOConnector.prototype.getReadyState = function () {
        return this._ws ? SocketIOConnector.SOCKET_STATES[this._ws.io.readyState] : consts.SOCKET_STATES.CLOSED;
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

    SocketIOConnector.SOCKET_STATES = {};

    Object.keys(consts.SOCKET_STATES).forEach(function (key) { //socketio uses strings not numbers
        SocketIOConnector.SOCKET_STATES[key.toLowerCase()] = consts.SOCKET_STATES[key];
    });

    return SocketIOConnector;
});