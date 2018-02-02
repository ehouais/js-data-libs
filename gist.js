define(['on-demand'], function(OnDemand) {
    return function() {
        var githubPwd = OnDemand(sessionStorage, 'githubPwd'),
            dbGistId = OnDemand(localStorage, 'dbGistId'),
            uri = function() {
                return 'https://api.github.com/gists/'+dbGistId();
            },
            headers = function() {
                headers = new Headers();

                headers.append('Accept', 'application/vnd.github.v3+json');
                headers.append('Authorization', 'Basic '+btoa('ehouais:'+githubPwd()));

                return headers;
            },
            get = function() {
                return fetch(uri(), {
                    headers: headers()
                }).then(function(response) {
                    return response.json();
                }).then(function(json) {
                    return json.files;
                });
            },
            patch = function(filename, content) {
                var files = {};
                files[filename] = content;

                return fetch(uri(), {
                    method: 'PATCH',
                    headers: headers(),
                    body: JSON.stringify({files: files})
                });
            };

        return {
            getAll: function() {
                return get();
            },
            create: function(filename) {
                return patch(filename, {content: ''});
            },
            get: function(filename) {
                return get().then(function(files) {
                    return files[filename].content;
                });
            },
            update: function(filename, data) {
                return patch(filename, {content: data});
            },
            delete: function(filename) {
                return patch(filename, null);
            }
        }
    };
});
