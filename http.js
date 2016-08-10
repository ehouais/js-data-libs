define([], function() {
    var parseHeaders = function(headers) {
            return headers.split('\n').reduce(function(map, line) {
                var tokens = line.match(/([^\:]+)\:(.*)/);
                if (tokens) map[tokens[1]] = tokens[2];
                return map;
            }, {});
        },
        request = function(method, uri, headers, data, cb) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    cb(xhr.responseText, xhr.status, parseHeaders(xhr.getAllResponseHeaders()));
                }
            }
            xhr.open(method, uri, true);
            if (headers) {
                for(var name in headers) {
                    xhr.setRequestHeader(name, headers[name]);
                }
            }
            xhr.send(data);
        };

    return {
        get: function(uri, headers, cb) {
            request('GET', uri, headers, null, cb);
        },
        put: function(uri, headers, data, cb) {
            request('PUT', uri, headers, data, cb);
        },
        post: function(uri, headers, data, cb) {
            request('POST', uri, headers, data, cb);
        },
        delete: function(uri, headers, cb) {
            request('DELETE', uri, headers, null, cb);
        },
    }
})