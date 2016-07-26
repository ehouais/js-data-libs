define(['streams', 'immutable'], function(Stream, Immutable) {
    var isURI = function(obj) {
            return typeof obj == 'string' && obj.match(/^https?:\/\//); // TODO: more robust
        };

    return function(http) {
        var link = function(name) {
                return function(resource) {
                    return resource && resource.has(name) && isURI(resource.get(name)) && http(resource.get(name)); // TODO: check valid URI ?
                };
            },
            prefetch = function() {
                var paths = Array.prototype.slice.call(arguments),
                    equip = function(value, path) {
                        if (isURI(value)) {
                            return prefetch(http(value), path);
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
            },
            // recursively detect URIs in given value, and returns a stream if found, or the original value
            toStream = function(obj) {
                if (isURI(obj)) {
                    return {stream: true, value: http(obj)};
                } else if (Immutable.Iterable.isIterable(obj)) {
                    var resolved = obj.reduce(function(res, item, key) {
                            var r = toStream(item);
                            res.stream = res.stream || r.stream;
                            res.value[key] = r.value;
                            return res;
                        }, {stream: false, value: obj.toJS()});

                    if (resolved.stream) resolved.value = Stream.combine(resolved.value);
                    return resolved;
                } else {
                    return {stream: false, value: obj};
                }
            },
            linkify = function(stream) {
                // transform URIs into streams in stream values
                if (isURI(stream)) {
                    stream = http(stream);
                }

                /*stream = stream.select(function(value) {
                    var resolved = toStream(value);
                    return resolved.stream ? resolved.value : stream;
                });*/

                // transform stream methods to linkify returned stream
                var select = stream.select;
                stream.select = function(filter) { return linkify(select.call(stream, filter)); };
                stream.map = function(filter) { return linkify(stream.map(filter)); };
                stream.property = function(propName) { return linkify(stream.property(propName)); };

                stream.link = function(propName) {
                    return stream.select(link(propName));
                };
                stream.prefetch = function() {
                    return stream.select(prefetch.apply(this, Array.prototype.slice.call(arguments)));
                };

                return stream;
            };

        return linkify;
    }
});
