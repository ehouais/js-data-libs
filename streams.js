define(['immutable', 'observable'], function(Immutable, Observable) {
    var isDefined = function(value) {
            return value !== void(0);
        };
    var stream = function(firstBind, lastUnbind) {
            var obj = {},
                obs = Observable(),
                nbHandlers = 0,
                current,
                // ouput represents the stream outflow, which cannot be used to push data into the stream
                output = {
                    bind: function(handler) {
                        nbHandlers++ == 0 && firstBind && firstBind.call(obj); // call provided callback on first subscription
                        obs.object().bind(handler);                            // add new subscriber to list
                        isDefined(current) && handler(current);                // push current value (if any) to new subscriber
                        return output;                                         // return stream for chaining
                    },
                    unbind: function(handler) {
                        obs.object().unbind(handler);                            // remove subscriber from list
                        --nbHandlers == 0 && lastUnbind && lastUnbind.call(obj); // call provided callback on last unsubscription
                        return output;                                           // return stream for chaining
                    },
                    // attach a handler function that is triggered and detached at once
                    once: function(handler) {
                        output.bind(function localHandler(data) {
                            if (isDefined(data)) {
                                handler(data);
                                output.unbind(localHandler);
                            }
                        });
                        return output;
                    },
                    // return a stream that publishes the values from the current stream, modified by the provided filter function
                    map: function(filter) { // filter = function(Immutable) > value
                        var localHandler = function(value) {
                                ls.push(filter(value));
                            },
                            ls = stream(function() {
                                output.bind(localHandler);
                            }, function() {
                                output.unbind(localHandler);
                            });
                        return ls.output();
                    },
                    amap: function(filter) { // filter = function(Immutable) > cb(value)
                        var localHandler = function(value) {
                                filter(value, function(data) {
                                    ls.push(data);
                                });
                            },
                            ls = stream(function() {
                                output.bind(localHandler);
                            }, function() {
                                output.unbind(localHandler);
                            });
                        return ls.output();
                    },
                    // return a stream selected using the value from the current stream and the selector/generator function
                    select: function(filter) { // filter = function(Immutable) > stream
                        var ls, // new stream
                            ss, // selected stream
                            sHandler = function(value) {
                                ls.push(value);
                            },
                            localHandler = function(value) {
                                ss && ss.unbind(sHandler);
                                ss = filter.call(output, value);
                                ss ? ss.bind(sHandler) : ls.push();
                            },
                            ls = stream(function() {
                                output.bind(localHandler);
                            }, function() {
                                output.unbind(localHandler);
                            });

                        return ls.output();
                    },
                    // Publish data from current stream possibly altered by data coming from given stream
                    merge: function(str, merger) {
                        var current,
                            localHandler = function(data) {
                                current = data;
                                update();
                            },
                            mcurrent,
                            mHandler = function(data) {
                                mcurrent = data;
                                update();
                            },
                            update = function() {
                                ls.push(isDefined(current) && isDefined(mcurrent) ? merger(current, mcurrent) : current);
                            },
                            ls = stream(function() {
                                output.bind(localHandler);
                                str.bind(mHandler);
                            }, function() {
                                output.unbind(localHandler);
                                str.unbind(mHandler);
                            });

                        return ls.output();
                    },
                    // return a stream that publishes the property value (accessible with get()) of object values from the current stream
                    property: function(propName) {
                        return output.map(function(obj) {
                            if (obj && obj.has && obj.has(propName)) return obj.get(propName);
                        });
                    }
                };

            obj.push = function(value) {
                value = Immutable.fromJS(value);
                if (value !== current) {
                    obs.trigger(current = value);
                }

                return obj;
            };
            obj.output = function() {
                return output;
            };

            return obj;
        };

    // combine N values/streams into one that publishes the N aggregated values for each different & complete set of values
    // {key1: value1/stream1, key2: value2/stream2, ...} > {key1: value1, key2: value2, ...}
    stream.combine = function(streams, sparse) {
        var map = !Array.isArray(streams),
            current = map ? Immutable.Map({}) : Immutable.List(),
            loop = function(cb) {
                if (map) {
                    for (var key in streams) cb(streams[key], key)
                } else {
                    streams.forEach(cb);
                }
            },
            handlers = {},
            isBindable = function(subject) {
                return subject !== null && typeof subject === 'object' && subject.bind;
            },
            pushIf = function() {
                // Check that all members have a value
                var push = true;
                !sparse && loop(function(item, key) {
                    if (!isDefined(current.get(key))) {
                        push = false;
                    }
                });
                push && ls.push(current);
            },
            handler = function(skey) {
                return function(value) {
                    current = current.set(skey, value);
                    pushIf();
                }
            },
            ls = stream(function() {
                loop(function(stream, key) {
                    if (isBindable(stream)) {
                        stream.bind(handlers[key] = handler(key));
                    }
                });
            }, function() {
                loop(function(stream, key) {
                    if (isBindable(stream)) {
                        stream.unbind(handlers[key]);
                    }
                });
            });

        loop(function(stream, key) {
            if (!isBindable(stream)) {
                current = current.set(key, Immutable.fromJS(streams[key]));
            }
        });
        pushIf();

        return ls.output();
    };

    // create a stream that emulates a map and publishes the modifications
    stream.Map = function() {
        var current = Immutable.Map(),
            lstream = stream(),
            output = lstream.output();

        output.set = function(key, value) {
            lstream.push(current = current.set(key, value));
        };
        output.unset = function(key) {
            lstream.push(current = current.delete(key));
        };

        return output;
    }

    // create a stream from a simple observable (with bind and unbind methods),
    // preventing duplicate notified values
    stream.fromObservable = function(observable) {
        var current,
            handler = function(value) {
                var val = Immutable.fromJS(value);
                if (val !== current) {
                    current = val;
                    lstream.push(current);
                }
            },
            lstream = stream(function() {
                observable.bind(handler);
            }, function() {
                observable.unbind(handler);
            });

        return lstream.output();
    };

    // create a stream from events on target dom element
    stream.fromEvent = function(target, eventName) {
        var lstream = stream(),
            domNode = document.querySelector(target);

        if (document.addEventListener) {                // For all major browsers, except IE 8 and earlier
            domNode.addEventListener(eventName, lstream.push);
        } else if (document.attachEvent) {              // For IE 8 and earlier versions
            domNode.attachEvent("on" + eventName, function(e) {
                e = e || window.event;
                lstream.push(e);
            });
        }

        return lstream.output();
    };

    stream.empty = stream().output();

    return stream;
});
