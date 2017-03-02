define([], function() {
    var parseHeaders = function(headers) {
            return headers.split('\n').reduce(function(map, line) {
                var tokens = line.match(/([^\:]+)\:(.*)/);
                if (tokens) map[tokens[1]] = tokens[2].trim();
                return map;
            }, {});
        },
        request = function(method, uri, headers, data, cb, cors) {
            var xhr = new XMLHttpRequest();

            if (cors) {
                if ('withCredentials' in xhr) {
                    xhr.withCredentials = true;
                    xhr.open(method, uri, true);
                } else if (typeof XDomainRequest != 'undefined') {
                    xhr = new XDomainRequest();
                    xhr.open(method, uri);
                } else {
                    throw new Error('CORS not supported');
                }
            }

            xhr.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    cb(this.response, this.status, parseHeaders(this.getAllResponseHeaders()));
                }
            }

            xhr.send(data);
        };

    return {
        get: function(uri, headers, cb, cors) {
            request('GET', uri, headers, null, cb, cors);
        },
        put: function(uri, headers, data, cb, cors) {
            request('PUT', uri, headers, data, cb, cors);
        },
        post: function(uri, headers, data, cb, cors) {
            request('POST', uri, headers, data, cb, cors);
        },
        delete: function(uri, headers, cb, cors) {
            request('DELETE', uri, headers, null, cb, cors);
        },
    }
})
