define(['http'], function(Http) {
    return function(user, password, id) {
        var uri = 'https://api.github.com/gists/'+id,
            auth = btoa(user+':'+password),
            addHeaders = function(xhr) {
                xhr.setRequestHeader ('Accept', 'application/vnd.github.v3+json');
                xhr.setRequestHeader ('Authorization', 'Basic '+auth);
            },
            get = function(cb) {
                Http.get(uri, function(json) {
                    cb(JSON.parse(json).files);
                }, false, addHeaders);
            },
            patch = function(filename, content, cb) {
                var files = {};
                files[filename] = content;
                Http.patch(uri, JSON.stringify({files: files}), cb, false, addHeaders);
            };

        return {
            getAll: function(cb) {
                get(cb);
            },
            create: function(filename, cb) {
                patch(filename, {content: ''}, cb);
            },
            get: function(filename, cb) {
                get(function(files) {
                    cb(files[filename]);
                });
            },
            update: function(filename, data, cb) {
                patch(filename, {content: data}, cb);
            },
            delete: function(filename, cb) {
                patch(filename, null, cb);
            }
        }
    };
});
