define(['sjcl'], function(sjcl) {
    return {
        cipher: function(key, data) {
            return sjcl.encrypt(key(), data, {ks: 256});
        },
        decipher: function(key, data) {
            try {
                // test whether data is valid JSON
                var obj = JSON.parse(data);

                // test if data is a SJCL-ciphered structure
                if (obj.iv && obj.v && obj.iter && obj.ks && obj.ts && obj.mode && obj.cipher && obj.salt && obj.ct) {
                    // try to decipher data
                    try {
                        return sjcl.decrypt(key(), data);
                    } catch(e) {
                        window.alert('Invalid key or corrupt cipher text');
                    }
                } else {
                    // data is JSON, but not cipher structure
                    return data;
                }
            } catch(e) {
                // data is not JSON
                return data;
            }
        }
    }
});
