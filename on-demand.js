define(function() {
    return function(array, key) {
        return function() {
            var value = array[key];
            if (!value) {
                value = window.prompt(key);
                array[key] = value;
            }
            return value;
        };
    };
});
