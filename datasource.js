define(['on-demand'], function(OnDemand) {
    var resolved = function(data) {
            return new Promise(function(resolve, reject) {
                resolve(data);
            });
        };

    return function(str) {
        var match,
            str;

        // data: URI
        if (match = str.match(/^data:([^,;]+)(;[^,]+)?,(.*)/)) {
            str = decodeURIComponent(match[3]);
            if (match[1] == 'text/csv') {
                str = str.replace(/;/g, '\n');
            }
            return resolved(str);

        // generic HTTP resource
        } else if (str.match(/^https?:/)) {
            return fetch(uri).then(function(response) {
                return response.body();
            });

        // mLab document or gist file
        } else if (match = str.match(/db\/(.+)/)) {
            return new Promise(function(resolve, reject) {
                require(['mlab'], function(Mlab) {
                    var id = match[1],
                        db = Mlab('misc', 'webviews');
            
                    db.select({query: {id: id}, unique: true}).then(function(response) {
                        if (response) {
                            return response.body();
                        } else {
                            return new Promise(function(resolve, reject) {
                                require(['gist'], function(Gist) {
                                    Gist().get(id).then(resolve);
                                });
                            });
                        }
                    }).then(resolve);
                });
            });

        // Google spreadsheet
        } else if (match = str.match(/gs\/(.+)/)) {
            return new Promise(function(resolve, reject) {
                require(['tabletop'], function(Tabletop) {
                    Tabletop.init({
                        key: 'https://docs.google.com/spreadsheets/d/'+match[1]+'/pubhtml',
                        simpleSheet: true,
                        callback: function(data, tabletop) {
                            var sheet = tabletop.models[tabletop.modelNames[0]]; // first sheet
                            resolve({
                                cols: sheet.columnNames.map(function(name) {
                                    return {label: name};
                                }),
                                rows: sheet.toArray()
                            });
                        }
                    });
                });
            });

        // raw data
        } else {
            return resolved(str);

        }
    };
});
