define(function() {
    return function(storageKey) {
        return function() {
            var value = sessionStorage[storageKey];
            if (!value) {
                value = window.prompt(storageKey);
                sessionStorage[storageKey] = value;
            }
            return value;
        };
    };
});
