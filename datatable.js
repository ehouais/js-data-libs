define([], function() {
    return {
        dataFromCsv: function(str, cols) {
            return str.trim().split('\n').map(function(row, j) {
                return row.split(',').map(function(cell, i) {
                    switch(cols[i]) {
                    case 'text':
                        return cell;
                    case 'date': // dd/mm/yyyy or dd/mm/yy
                        var match = cell.match(/(\d{2})\/(\d{2})(\/(\d+))?/),
                            year;

                        if (!match) return null;

                        if (!match[3]) {
                            year = new Date().getFullYear();
                        } else {
                            year = +match[4];
                            if (year < 100) {
                                year += year < 50 ? 2000 : 1900;
                            }
                        }
                        return new Date(year+'-'+match[2]+'-'+match[1]);
                    default: // 'numeric'
                        return cell.split('+').reduce(function(sum, term) {
                            return +term+sum;
                        }, 0);
                    }
                });
            });
        }
    }
});
