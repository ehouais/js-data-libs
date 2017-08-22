define(function() {
    return function(array, key) {
        return function() {
            var value = array[key];
            if (!value) {
                value = window.prompt(key);
                if (value !== null)
                    array[key] = value;
            }
            return value;
        };
    };
});
