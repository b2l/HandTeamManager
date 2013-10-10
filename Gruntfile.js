module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    // Project configuration.
    grunt.initConfig({

        /* Update version */
        'bumpup': {
            options: {
                version: function (old, type) {
                    return old.replace(/([\d])+$/, grunt.option('wc-version'));
                }
            },
            file: 'package.json'
        },

        /* DEV MODE - auto compile & test */
        'watch': {
            'src': {
                files: ['src/**/*.js'],
                tasks: ['browserify']
            }
        },

        browserify: {
            options: {
                debug: true
            },
            'demo/app.js': ['src/app.js']
        }
    });

    grunt.registerTask('build', ['jshint']);
    grunt.registerTask('dist', ['jshint', 'bumpup']);
    grunt.registerTask('dev', ['browserify', 'watch']);
    grunt.registerTask('test', ['browserify', 'testem:ci:spa', 'testem:ci:qunit']);
    grunt.registerTask('default', ['watch']);
};