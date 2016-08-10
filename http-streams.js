define(['streams', 'immutable'], function(Stream, Immutable) {
    var isURI = function(obj) {
            return typeof obj == 'string' && obj.match(/^https?:\/\//); // TODO: more robust
        };

    return function(http) {
        var uriToStream = function(uri) {
                return Stream(function() {
                    var stream = this;
                    http.get(uri, {}, function(body, status, headers) {
                        if (status == '200') {
                            if (headers['Content-Type'].indexOf('application/json') != -1) {
                                body = JSON.parse(body);
                            }
                            stream.push(body);
                        } else {
                            stream.push();
                        }
                    });
                }).output();
            },
            prefetch = function() {
                var paths = Array.prototype.slice.call(arguments),
                    equip = function(value, path) {
                        if (isURI(value)) {
                            return prefetch(uriToStream(value), path);
                        } else if (value !== null && typeof value === "object" && value.toJS) {
                            return prefetch(Stream.combine(value.toJS()), path);
                        } else {
                            return value;
                        }
                    },
                    prefetch = function(stream, path) {
                        if (!path) return stream;

                        var tokens = path.split('.'),
                            token = tokens.shift(),
                            item = token.match(/([^\[]*)\[(\d+)\]/);

                        if (item) {
                            if (item[1]) {
                                token = item[1];
                                tokens.unshift(item[2]);
                            } else {
                                token = item[2];
                            }
                        }
                        path = tokens.join('.');

                        return stream.select(function(data) {
                            var optional = token.slice(-1) == '?';

                            if (data) {
                                if (optional) token = token.slice(0, -1);
                                if (token == '*') {
                                    if (Immutable.List.isList(data) || Immutable.Map.isMap(data)) {
                                        data.forEach(function(item, key) {
                                            data = data.set(key, equip(item, path));
                                        });
                                    }
                                } else if (data.has(token)) {
                                    data = data.set(token, equip(data.get(token), path));
                                }
                                return Stream.combine(data.toJS(), optional);
                            }
                        });
                    };

                return function(resource) {
                    return resource && paths.reduce(prefetch, Stream.combine(resource.toJS()));
                };
            };

        var hs = function(uri) {
            return isURI(uri) ? uriToStream(uri) : uri.select(uriToStream);
        }
        hs.linkify = function(stream) {
            // Add 2 methods and transform original methods
            // to propagate the new methods to the streams built from this one

            var overload = function(methodName) {
                    var original = stream[methodName];
                    stream[methodName] = (function() {
                        return hs.linkify(original.apply(this, Array.prototype.slice.call(arguments)))
                    }).bind(stream);
                };

            overload('select');
            overload('map');
            overload('property');

            stream.link = function(propName) {
                return stream.select(function(resource) {
                    return resource && resource.has(propName) && isURI(resource.get(propName)) && uriToStream(resource.get(propName));
                });
            };
            stream.prefetch = function() {
                return stream.select(prefetch.apply(this, Array.prototype.slice.call(arguments)));
            };

            return stream;
        };

        return hs;
    }
});
