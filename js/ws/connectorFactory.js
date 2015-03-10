define(function (require) {
    "use strict";

    var SockjsConnector = require("ws/SockjsConnector"),
        WSConnector = require("ws/WSConnector"),
        SocketIOConnector =require("ws/SocketIOConnector"),
        connectors = {},
        WS_TYPES = {
            "WS": "ws",
            SOCK_JS: "sockjs",
            SOCKET_IO: "socketio"
        };

    connectors[WS_TYPES.WS] = WSConnector;
    connectors[WS_TYPES.SOCK_JS] = SockjsConnector;
    connectors[WS_TYPES.SOCKET_IO] = SocketIOConnector;

    function getConnectorType(wsType) {

        var cType = connectors[wsType];

        if (!cType) {
            throw new TypeError("WS connector factory - unknown type: " + wsType);
        }

        return cType;
    }

    return {
        getConnectorType: getConnectorType,
        WS_TYPES: WS_TYPES
    };
});