// HTTP cache
define(['http', 'cache'], function(Http, Cache) {
    var lut = {},
        cache = Cache(function(id, cb) {
            var params = lut[id];
            Http.get(params.uri, params.headers, function(result) {
                cb(result);
            });
        }),
        requestHash = function(uri, headers) {
            return JSON.stringify({
                uri: uri,
                headers: Object.keys(headers || {}).sort().map(function(name) { return headers[name]; }) // sorted to be canonical
            });
        };

    return {
        get: function(uri, headers, cb) {
            var hash = requestHash(uri, headers);

            lut[hash] = {uri: uri, headers: headers};
            cache.get(hash, cb);
        },
        purge: cache.purge.bind(this)
    };
});
