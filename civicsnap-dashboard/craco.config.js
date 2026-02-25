const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@core': path.resolve(__dirname, 'src/core'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@fonts': path.resolve(__dirname, 'src/fonts'),
        },
    },
};