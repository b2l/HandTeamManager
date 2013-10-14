module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    // Project configuration.
    grunt.initConfig({

        /* DEV MODE - auto compile & test */
        'watch': {
            'src': {
                files: ['src/**/*.js'],
                tasks: ['jshint', 'browserify']
            }
        },

        browserify: {
            options: {
                debug: true
            },
            'public/js/app.js': ['src/app.js']
        }
    });

    grunt.registerTask('build', ['jshint']);
    grunt.registerTask('dev', ['browserify', 'watch']);
    grunt.registerTask('test', ['browserify', 'testem:ci:spa', 'testem:ci:qunit']);
    grunt.registerTask('default', ['watch']);
};