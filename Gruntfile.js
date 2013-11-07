module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify2');
    grunt.loadNpmTasks('grunt-contrib-compass');

    // Project configuration.
    grunt.initConfig({

        /* DEV MODE - auto compile & test */
        'watch': {
            'src': {
                files: ['assets/**/*'],
                tasks: ['buildAssets']
            }
        },

        browserify2: {
            dev: {
                entry: './assets/src/app.js',
                compile: './public/js/app.js',
                debug: false
            }
        },

        compass: {
            dev: {
                options: {
                    environment: 'development',
                    outputStyle: 'expanded',
                    imagesDir: './assets/images',
                    generatedImagesDir: './public/img',
                    relativeAssets: true,
                    sassDir: './assets/scss',
                    cssDir: './public/css'
                }
            }
        }
    });

    grunt.registerTask('default', ['buildAssets', 'watch']);

    grunt.registerTask('buildAssets', ['browserify2', 'compass:dev']);
};