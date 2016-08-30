define(['streams', 'immutable'], function(Stream, Immutable) {
    var isURI = function(obj) {
            return typeof obj == 'string' && obj.match(/^https?:\/\//); // TODO: more robust
        };

    return function(http) {
        var streams = {},
            refresh = function(uri) {
                var stream = streams[uri];

                if (stream) {
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
                }
            },
            uriToStream = function(uri) {
                var stream;

                if (uri) {
                    stream = streams[uri];

                   if (!stream) {
                       stream = streams[uri] = Stream(function() {
                           refresh(uri);
                       });
                   }

                   return stream.output();
               }
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

        // uri can be an URI or an URI stream
        var hs = function(uri) {
                return isURI(uri) ? uriToStream(uri) : uri.select(uriToStream);
            };

            // Overload original methods
            // to propagate the new methods to the streams built from this one
        var overload = function(stream, methodName) {
                var original = stream[methodName];
                stream[methodName] = (function() {
                    return linkify(original.apply(this, Array.prototype.slice.call(arguments)))
                }).bind(stream);
            };
        var linkify = function(stream) {
            overload(stream, 'select');
            overload(stream, 'map');
            overload(stream, 'property');

            // Add 2 new methods to make use of URIs in streamed objetcs
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

        hs.linkify = function(stream) {
            if (isURI(stream)) stream = uriToStream(stream);
            return linkify(stream);
        };
        hs.refresh = refresh.bind(this);

        return hs;
    }
});
