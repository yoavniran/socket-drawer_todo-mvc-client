define(function (require) {
    "use strict";

    var _ = require("underscore"),
        $ = require("jquery"),
        Marionette = require("marionette"),
        consts = require("consts"),
        connectorFactory = require("ws/connectorFactory");

    var WebsocketsController = Marionette.Controller.extend({

        initialize: function (options) {

            options = options || {};

            this._vent = options.vent;
            this._started = false;
            this._deferredMessages = $.Deferred();
            this._connector = null;

            _configure.call(this, options);
        },

        /**
         * disconnect is final, once called, the instance should be destroyed and a new one should be created
         * @returns {WebsocketsController}
         */
        disconnect: function () {

            console.log("[WebsocketsController]:: disconnect: about to disconnect socket");

            this._started = false;

            if (this._connector){
                if (this._connector.getReadyState() < consts.SOCKET_STATES.CLOSING){
                    this._connector.close();
                }

                delete this._connector;
            }

            _onSocketClose.call(this);

            return this;
        },

        send: function (msg) {

            console.log("[WebsocketsController]: received call to send data over websockets: ", msg);

            var msgSend = function () {

                if (_.isObject(msg)) {
                    msg = JSON.stringify(msg);
                }

                this._connector.send(msg);
            }.bind(this);

            var readyToSend = _isReadyToSendMessages.call(this);

            if (readyToSend) {
                msgSend();
            }
            else {
                console.log("[WebsocketsController]:: queuing message sending until connection is open!");
                this._deferredMessages.then(msgSend); //queue until connection is open
            }

            return this;
        },

        isStarted: function () {
            return this._started;
        },

        getSocketState: function () {
            return this._connector ? this._connector.getReadyState() : undefined; //this._sockjs ? this._sockjs.readyState : undefined;
        },

        onDestroy: function () {

            console.log("[WebsocketsController]:: controller closing");
            this.disconnect();
        }
    });

    function _isReadyToSendMessages() {
        return this.getSocketState() === consts.SOCKET_STATES.OPEN;
    }

    function _configure(options) {

        this.EVENT_PREFIX = "ws:";

        _retrieveImplementationType.call(this, options);

        this.listenTo(this._vent, this.EVENT_PREFIX + "send", this.send);
    }

    function _initializeWithType(wsType, options){

        var ConnectorType = connectorFactory.getConnectorType(wsType);

        this._connector = new ConnectorType(options);

        _startConnection.call(this);
    }

    function _retrieveImplementationType(options) {   //get the type of sockets implementation to use from the server

        $.ajax({
            url: options.serverUrl + "/api/wsType",
            dataType: "jsonp",
            context: this,
            success: function(data){
              _initializeWithType.call(this, data.implementation, options);
            },
            error:function(jqXHR){
                console.log("FAILED GETTING WS TYPE !!!! ", jqXHR);
            }
        });
    }

    function _startConnection() {

        console.log("[WebsocketsController]:: start : about to open ws connection");

        this._started = true;

        if (this._connector && this._connector.getReadyState() === consts.SOCKET_STATES.CLOSED){   //if (!this._sockjs || this._sockjs.readyState === SockJS.CLOSED) {

            this._connector.connect(); //var sockjs = this._sockjs = new SockJS(this._sockUrl); //, null, {server: "this_is_a_test"});

            this.listenTo(this._connector, "socket-open", _onSocketOpen);
            this.listenTo(this._connector, "socket-message", _onSocketData);
            this.listenTo(this._connector, "socket-close", _onSocketClose);
        }
        else {
            console.warn("[WebsocketsController]:: start: cant open a new connection while the socket is still open");
        }
    }

    function _onSocketOpen() {

        console.log("[WebsocketsController]:: onSocketOpen : connection open with server, state: ", this.getSocketState());
        this._deferredMessages.resolve();
        this._vent.trigger(this.EVENT_PREFIX + "open");
    }

    function _onSocketData(ev) {

        var data = ev.data || ev;
        var resource = "resource";

        console.log("[WebsocketsController]:: onSocketData : received event from server");

        try {
            data = JSON.parse(data);
        }
        catch (e) {
            console.error("[WebsocketsController]:: failed to parse websockets data", e);
        }

        console.log("[WebsocketsController]:: received data from server: ", data);

        if (data.resource) {
            resource += ":" + data.resource;
        }

        setTimeout(function () { //step outside of the frame so the listeners calls wont be part of this flow
            this._vent.trigger(this.EVENT_PREFIX + resource, data, data.clientId, ev);    //will trigger on key: ws:resource:_resource_
        }.bind(this), 0);
    }

    function _onSocketClose() {

        console.log("[WebsocketsController]:: onSocketClose : connection closed with server");

        this._deferredMessages = $.Deferred(); //get ready for queued messages while connection is closed
        this._vent.trigger(this.EVENT_PREFIX + "close");
        this.stopListening(this._vent, this.EVENT_PREFIX + "send", this.send);
    }

    return WebsocketsController;
});