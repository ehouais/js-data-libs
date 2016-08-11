define([], function() {
    var isDefined = function(value) {
            return value !== void(0);
        };

    return function(fetch) {
        var cache = {};
        return {
            get: function(id, cb) {
                var value = cache[id];

                if (isDefined(value)) {
                    cb(value);
                } else {
                    fetch(id, function(value) {
                        cache[id] = value;
                        cb(value);
                    });

                }
            },
            empty: function(id) {
                cache = {};
            }
        };
    }
});
