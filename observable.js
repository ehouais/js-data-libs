define([], function() {
    return function() {
        var handlers = [],
            observable = {},
            object = {
                bind: function(handler) {
                    handlers.push(handler);
                    return this;
                },
                unbind: function(handler) {
                    handlers = handlers.filter(function(item) {
                        return item !== handler;
                    });
                    return this;
                }
            };

        observable.trigger = function(value) {
            handlers.forEach(function(handler) {
                handler(value);
            });
        };
        observable.object = function() {
            return object;
        };
        return observable;
    };
});
