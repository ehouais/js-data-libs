define(function() {
    var resolved = function(data) {
            return new Promise(function(resolve, reject) {
                resolve(data);
            });
        },
        decipherObj = function(obj, key) {
            // test if obj is a SJCL-ciphered structure
            if (obj.iv && obj.v && obj.iter && obj.ks && obj.ts && obj.mode && obj.cipher && obj.salt && obj.ct) {
                return new Promise(function(resolve, reject) {
                    require(['sjcl'], function(sjcl) {
                        try {
                            // try to decipher data
                            resolve(sjcl.decrypt(key(), JSON.stringify(obj)));
                        } catch(e) {
                            reject('Invalid key or corrupt cipher text');
                        }
                    });
                });
            } else {
                return obj;
            }
        };

    return function(str, key) {
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

        // mLab document
        } else if (match = str.match(/db\/(.+)/)) {
            return new Promise(function(resolve, reject) {
                require(['mlab'], function(Mlab) {
                    var id = match[1],
                        db = Mlab('misc', 'webviews');
            
                    db.select({query: {id: id}, unique: true}).then(function(doc) {
                        return decipherObj(doc.value, key);
                    }).then(resolve).catch(function(error) {
                        console.error('Fetch error: '+error);
                    });
                });
            });

        // gist file
        } else if (match = str.match(/gs\/(.+)/)) {
            return new Promise(function(resolve, reject) {
                require(['gist'], function(Gist) {
                    Gist().get(id).then(function(str) {
                        try {
                            // test whether str is valid JSON
                            resolve(decipherObj(JSON.parse(str), key));
                        } catch(e) {
                            // str is not valid JSON
                            resolve(str);
                        }                    
                    });
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
