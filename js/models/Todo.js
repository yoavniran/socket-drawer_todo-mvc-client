/*global define */
define(function (require) {
	"use strict";

    var WebsocketsModel = require("models/WebsocketsModel");

	var TodoModel = WebsocketsModel.extend({

		defaults: {
			title: '',
			completed: false,
			created: 0
		},

		initialize: function () {
			if (this.isNew()) {
				this.set('created', Date.now());
			}
		},

		toggle: function () {
			return this.set('completed', !this.get('completed'));
		}
	});

    return TodoModel;
});