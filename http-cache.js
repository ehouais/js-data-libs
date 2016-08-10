// HTTP cache
define(['http', 'cache'], function(Http, Cache) {
    var lut = {},
        cache = Cache(function(id, cb) {
            var params = lut[id];
            Http.get(params.uri, params.headers, function(body, status, headers) {
                cb({body: body, status: status, headers: headers});
            });
        }),
        requestId = function(uri, headers) {
            return JSON.stringify({
                uri: uri,
                headers: Object.keys(headers || {}).sort().map(function(name) { return headers[name]; }) // sorted to be canonical
            });
        };

    return {
        get: function(uri, headers, cb) {
            var id = requestId(uri, headers);

            lut[id] = {uri: uri, headers: headers};
            cache.get(id, function(data) {
                cb(data.body, data.status, data.headers);
            });
        },
        purge: cache.purge.bind(this)
    };
});
