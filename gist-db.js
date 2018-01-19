define(['http'], function(Http) {
    return function(params) {
        var uri = 'https://api.github.com/gists/'+params.gistid,
            auth = 'Basic '+btoa(params.user+':'+params.password),
            addHeaders = function(xhr) {
                xhr.setRequestHeader ('Accept', 'application/vnd.github.v3+json');
                xhr.setRequestHeader ('Authorization', auth);
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
