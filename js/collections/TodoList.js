define(function (require) {
	"use strict";

    var WebSocketsCollection = require("collections/WebSocketsCollection"),
        TodoModel = require("models/Todo");

	var TodoList = WebSocketsCollection.extend({
		model: TodoModel,

        url: "/tasks",
        wsIdentifier: "TodoList",

        getCompleted: function () {
			return this.where({completed: true});
		},

		getActive: function () {
			return this.where({completed: false});
		},

		comparator: "created"
	});

    return TodoList;
});
