define(['on-demand'], function(OnDemand) {
    return function(database, collection, apiKey) {
        var apiKey = OnDemand(localStorage, 'mlabApiKey'),
            uri = function() {
                return 'https://api.mlab.com/api/1/databases/'+database+'/collections/'+collection+'?apiKey='+apiKey();
            },
            headers = new Headers();

        headers.append('Content-Type', 'application/json');
            
        return {
            insert: function(data) {
                return fetch(
                    uri(),
                    {method: 'POST', headers: headers, body: JSON.stringify(data)}
                ).then(function(response) {
                    return response.json();
                });
            },
            select: function(params) {
                return fetch(
                    uri()
                        +(params.query ? '&q='+JSON.stringify(params.query) : '')
                        +(params.filter ? '&f='+JSON.stringify(params.filter) : '')
                        +(params.unique ? '&fo=true' : ''),
                    {method: 'GET', mode: 'cors', headers: headers}
                ).then(function(response) {
                    return response.json();
                });
            },
            update: function(query, update) {
                return fetch(
                    uri()
                        +'&q='+JSON.stringify(query),
                    {method: 'PUT', headers: headers, body: JSON.stringify(update)}
                );
            },
            delete: function(query) {
                return fetch(
                    uri()
                        +'&q='+JSON.stringify(select),
                    {method: 'PUT', headers: headers, body: JSON.stringify([])}
                );
            }
        }
    };
});
