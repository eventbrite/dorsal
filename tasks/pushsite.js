module.exports = function (grunt) {

  var git = require('gift'),
      cp = grunt.file.cp,
      conf = grunt.config('push-site') || {},
      repo = git(process.cwd()),
      remote = grunt.option('remote') || conf.remote || 'origin',
      branch = grunt.option('branch') || conf.branch || 'master',
      message = grunt.option('message') || conf.message || 'updated dorsal site',
      ghPages = remote + '/gh-pages',
      seed = Math.random().toString(36).substring(10).substring(0, 6);

  grunt.registerTask('push-site', function() {

    repo.remote_fetch(remote, function (e) {

      if (e) { return new Error(e.text); }

      repo.checkout(['-b', seed, ghPages].join(' '), function (e) {

        if (e) { return new Error(e.text); }

        repo.checkout(branch + ' README.md', function (e) {

          if (e) { return new Error(e.text); }

          cp('README.md', '_includes/README.md', {force: true});

          repo.add('_includes/README.md', function (e) {

            if (e) { return new Error(e.text); }

            repo.commit(message, function (e) {

              repo.remote_push(remote, seed + ':gh-pages' , function (e) {
                if (e) {
                  return new Error(e.text);
                }
                else {
                  repo.checkout(branch, function (e) {

                    if (e) { return new Error(e.text); }

                    repo.delete_branch(seed, function (e) {

                      if (e) {
                        return new Error(e.text);
                      }
                      else {
                        grunt.log.oklns(message);
                      }
                    });
                  });
                }
              });
            });
          });
        });
      });
    });
  });
};
