define([], function() {
    var parseHeaders = function(headers) {
            return headers.split('\n').reduce(function(map, line) {
                var tokens = line.match(/([^\:]+)\:(.*)/);
                if (tokens) map[tokens[1]] = tokens[2].trim();
                return map;
            }, {});
        },
        request = function(method, uri, data, cb, cors, before) {
            var xhr = new XMLHttpRequest();

            if (cors) {
                if ('withCredentials' in xhr) {
                    xhr.withCredentials = true;
                } else if (typeof XDomainRequest != 'undefined') {
                    xhr = new XDomainRequest();
                } else {
                    throw new Error('CORS not supported');
                }
            }
            xhr.open(method, uri);

            xhr.onreadystatechange = function() {
                if (this.readyState === 4 && this.status < 400) {
                    cb(this.response, this.status, parseHeaders(this.getAllResponseHeaders()));
                }
            }

            before && before(xhr);
            xhr.send(data);
        };

    return {
        get: function(uri, cb, cors, before) {
            request('GET', uri, null, cb, cors, before);
        },
        put: function(uri, data, cb, cors, before) {
            request('PUT', uri, data, cb, cors, before);
        },
        post: function(uri, data, cb, cors, before) {
            request('POST', uri, data, cb, cors, before);
        },
        delete: function(uri, cb, cors, before) {
            request('DELETE', uri, null, cb, cors, before);
        },
        patch: function(uri, data, cb, cors, before) {
            request('PATCH', uri, data, cb, cors, before);
        },
    }
})
