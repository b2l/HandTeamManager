module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    // Project configuration.
    grunt.initConfig({

        /* DEV MODE - auto compile & test */
        'watch': {
            'src': {
                files: ['assets/**/*.js'],
                tasks: ['browserify']
            }
        },

        browserify: {
            'dist': {
                files: {
                    'public/js/app.js': [__dirname + '/assets/src/app.js']
                }
            }
        }
    });

    grunt.registerTask('default', ['browserify', 'watch']);
};