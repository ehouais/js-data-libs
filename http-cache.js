// HTTP cache
define([], function() {
    var caches = {},
        request = function(method, uri, data, cb) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var data = xhr.responseText;
                    if (xhr.getResponseHeader('Content-Type').match(/application\/json/)) {
                        data = JSON.parse(data);
                    }
                    cb(data);
                }
            }
            xhr.open(method, uri, true);
            if (data) {
                // only JSON for now
                xhr.setRequestHeader('Content-Type', 'application/json');
                data = JSON.stringify(data);
            } else {
                xhr.setRequestHeader('Accept', 'application/json');
            }
            xhr.send(data);
        },
        fetch = function(uri, cached) {
            request('GET', uri, null, function(data) {
                cached.data = data;
                cached.handlers.forEach(function(handler) {
                    handler(data);
                });
            });
        };

    return function(id) {
        var id = id || 'global',
            cache = (caches[id] = caches[id] || {});

        return {
            get: function(uri, cb) {
                var cached;
                if (cache[uri]) {
                    cached = cache[uri];
                    // if resource has already been fetched
                    if (cached.data != undefined) {
                        cb(cached.data);
                    }
                    cached.handlers.push(cb);
                } else {
                    cached = cache[uri] = {handlers: [cb]};
                    fetch(uri, cached);
                }
            },
            // reset cache for given URI or whole cache
            refresh: function(uri) {
                // refresh all cache streams that are bound to the specified uri
                for (var key in cache) {
                    if (!uri || key == uri) {
                        delete cache[key];
                        fetch(key);
                    }
                }
            },
            put: function(uri, data, cb) {
                request('PUT', uri, data, cb);
            },
            post: function(uri, data, cb) {
                request('POST', uri, data, cb);
            },
            delete: function(uri, cb) {
                request('DELETE', uri, null, cb);
            },
        };
    };
});
