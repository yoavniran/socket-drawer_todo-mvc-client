define(function (require) {
    "use strict";

    var Marionette = require("marionette"),
        TodoList = require("collections/TodoList"),
        Header = require("views/Header"),
        TodoListCompositeView = require("views/TodoListCompositeView"),
        Footer = require("views/Footer"),
        WebSocketsController = require("controllers/WebSocketsController"),
        app = new Marionette.Application();

    app.addRegions({
        header: '#header',
        main: '#main',
        footer: '#footer'
    });

    app.addInitializer(function () {

        app.websocketsController = new WebSocketsController({vent: app.vent, serverUrl: "http://localhost:3001" });

        var todoList = _initializeTodoList.call(this);
        _initializeViews(todoList);

        this.vent.on('todoList:filter', function (filter) {
            app.footer.currentView.updateFilterSelection(filter);

            document.getElementById('todoapp').className = 'filter-' + (filter === '' ? 'all' : filter);
        });

        this.vent.on('todoList:clear:completed', function () {
            todoList.getCompleted().forEach(function (todo) {
                todo.destroy();
            });
        });

        todoList.fetch({vent: this.vent, listenMethod: ""});
    });

    function _initializeTodoList() {

        var coll = new TodoList(null, {vent: this.vent});

        this.listenTo(coll, 'all', function () {
            this.main.$el.toggle(coll.length > 0);
            this.footer.$el.toggle(coll.length > 0);
        });

        return coll;
    }

    function _initializeViews(todos) {

        var viewOptions = {
            collection: todos,
            vent: app.vent
        };

        var header = new Header(viewOptions);
        var main = new TodoListCompositeView(viewOptions);
        var footer = new Footer(viewOptions);

        app.header.show(header);
        app.main.show(main);
        app.footer.show(footer);
    }

    return window.app = app;
});
