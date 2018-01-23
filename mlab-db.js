define(['http'], function(Http) {
    return function(params) {
        var uri = 'https://api.mlab.com/api/1/databases/'+params.database+'/collections/'+params.collection+'?apiKey='+params.apikey,
            setContentType = function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            };

        return {
            create: function(data, cb) {
                Http.post(uri, JSON.stringify(data), cb, false, setContentType);
            },
            get: function(select, cb) {
                Http.get(uri
                    +(select.query ? '&q='+JSON.stringify(select.query) : '')
                    +(select.filter ? '&f='+JSON.stringify(select.filter) : '')
                    +(select.unique ? '&fo=true' : '')
                , function(json) {
                    cb(JSON.parse(json));
                });
            },
            update: function(select, update, cb) {
                Http.put(uri+'&q='+JSON.stringify(select), JSON.stringify(update), cb, false, setContentType);
            },
            delete: function(select, cb) {
                Http.put(uri+'&q='+JSON.stringify(select), JSON.stringify([]), cb, false, setContentType);
            }
        }
    };
});
