// HTTP cache
define(['jquery', 'streams'], function($, Stream) {
    var caches = {};

    return function(id) {
        var id = id || 'global',
            cache = (caches[id] = caches[id] || {}),
            defaultHeaders = {},
            request = function(params) {
                params.headers = defaultHeaders;
                return $.ajax(params);
            },
            get = function(uri) {
                var cached = cache[uri] = cache[uri] || {};

                if (!cached.promise) {
                    cached.promise = cached.promise || request({
                        url: uri,
                        type: 'GET',
                        dataType: 'json'
                    });
                }
                if (cached.stream) {
                    cached.promise.done(function(data) {
                        cached.stream.push(data);
                    }).fail(function() {
                        cached.stream.push(null);
                    });
                }
                return cached.promise;
            },
            // return a stream that publishes the resource fetched from given URI with specified headers
            http = function(uri) {
                if (uri) {
                    var cached = cache[uri] = cache[uri] || {};

                    if (!cached.stream || !cached.promise) {
                        cached.stream = cached.stream || Stream(function() {
                            get(uri);
                        });
                    }

                    return cached.stream.output();
                } else {
                    return Stream().push(uri).output(); // propagate difference between null and undefined
                }
            };

        // set default HTTP headers
        http.setDefaultHeaders = function(headers) {
            defaultHeaders = headers;
            http.refresh();
            return http;
        };
        // trigger cache reset for given URI
        http.refresh = function(uri) {
            var key;

            // refresh all cache streams that are bound to the specified uri
            for (key in cache) {
                if (!uri || key == uri) {
                    cache[key].promise = null;
                    get(key);
                }
            }

            return http;
        };

        http.get = get;
        http.put = function(uri, data) {
            return request({
                url: uri,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(data),
                dataType: 'json'
            });
        };
        http.post = function(uri, data) {
            return request({
                url: uri,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                dataType: 'json'
            });
        };
        http.delete = function(uri) {
            return request({
                url: uri,
                type: 'DELETE'
            });
        };

        return http;
    };
});
