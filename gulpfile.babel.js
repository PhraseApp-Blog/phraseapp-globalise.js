import fs from 'fs';
import path from 'path';

import gulp from 'gulp';
import concat from 'gulp-concat';

// Load all gulp plugins automatically
// and attach them to the `plugins` object
import plugins from 'gulp-load-plugins';

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
import runSequence from 'run-sequence';

import archiver from 'archiver';
import glob from 'glob';
import del from 'del';
import ssri from 'ssri';
import modernizr from 'modernizr';

import pkg from './package.json';
import modernizrConfig from './modernizr-config.json';


const dirs = pkg['h5bp-configs'].directories;

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', () => {
  fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', (done) => {

  const archiveName = path.resolve(dirs.archive, `${pkg.name}_v${pkg.version}.zip`);
  const zip = archiver('zip');
  const files = glob.sync('**/*.*', {
    'cwd': dirs.dist,
    'dot': true // include hidden files
  });
  const output = fs.createWriteStream(archiveName);

  zip.on('error', (error) => {
    done();
    throw error;
  });

  output.on('close', done);

  files.forEach((file) => {

    const filePath = path.resolve(dirs.dist, file);

    // `zip.bulk` does not maintain the file
    // permissions, so we need to add files individually
    zip.append(fs.createReadStream(filePath), {
      'name': file,
      'mode': fs.statSync(filePath).mode
    });

  });

  zip.pipe(output);
  zip.finalize();

});

gulp.task('clean', (done) => {
  del([
    dirs.archive,
    dirs.dist
  ]).then(() => {
    done();
  });
});

gulp.task('copy', [
  'copy:.htaccess',
  'copy:index.html',
  'copy:jquery',
  'copy:globalize:deps',
  'copy:globalize',
  'copy:cldr:data',
  'copy:license',
  'copy:main.css',
  'copy:misc',
  'copy:normalize'
]);

gulp.task('copy:.htaccess', () =>
  gulp.src('node_modules/apache-server-configs/dist/.htaccess')
    .pipe(plugins().replace(/# ErrorDocument/g, 'ErrorDocument'))
    .pipe(gulp.dest(dirs.dist))
);

gulp.task('copy:index.html', () => {
  const hash = ssri.fromData(
    fs.readFileSync('node_modules/jquery/dist/jquery.min.js'),
    {algorithms: ['sha256']}
  );
  let version = pkg.devDependencies.jquery;
  let modernizrVersion = pkg.devDependencies.modernizr;

  gulp.src(`${dirs.src}/index.html`)
    .pipe(plugins().replace(/{{JQUERY_VERSION}}/g, version))
    .pipe(plugins().replace(/{{MODERNIZR_VERSION}}/g, modernizrVersion))
    .pipe(plugins().replace(/{{JQUERY_SRI_HASH}}/g, hash.toString()))
    .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', () =>
  gulp.src(['node_modules/jquery/dist/jquery.min.js'])
    .pipe(plugins().rename(`jquery-${pkg.devDependencies.jquery}.min.js`))
    .pipe(gulp.dest(`${dirs.dist}/js/vendor`))
);

gulp.task('copy:globalize:deps', () =>
  gulp.src([
    'node_modules/cldrjs/dist/cldr.js',
    'node_modules/cldrjs/dist/cldr/event.js',
    'node_modules/cldrjs/dist/cldr/supplemental.js',
  ]).pipe(concat('cldr.js'))
    .pipe(gulp.dest(`${dirs.dist}/js/vendor`))
);

gulp.task('copy:cldr:data', ['copy:cldr:en', 'copy:cldr:el'], () =>
  gulp.src([
    'node_modules/cldr-data/supplemental/timeData.json',
    'node_modules/cldr-data/supplemental/weekData.json',
    'node_modules/cldr-data/supplemental/plurals.json',
    'node_modules/cldr-data/supplemental/likelySubtags.json',
  ]).pipe(gulp.dest(`${dirs.dist}/js/vendor/cldr/supplemental`))
);

gulp.task('copy:cldr:el', () =>
  gulp.src([
    'node_modules/cldr-data/main/el/ca-gregorian.json',
    'node_modules/cldr-data/main/el/currencies.json',
    'node_modules/cldr-data/main/el/numbers.json',
    'node_modules/cldr-data/main/el/units.json',
  ]).pipe(gulp.dest(`${dirs.dist}/js/vendor/cldr/el`))
);

gulp.task('copy:cldr:en', () =>
  gulp.src([
    'node_modules/cldr-data/main/en/ca-gregorian.json',
    'node_modules/cldr-data/main/en/currencies.json',
    'node_modules/cldr-data/main/en/numbers.json',
    'node_modules/cldr-data/main/en/units.json',
  ]).pipe(gulp.dest(`${dirs.dist}/js/vendor/cldr/en`))
);

gulp.task('copy:globalize', () =>
  gulp.src([
    'node_modules/globalize/dist/globalize.js',
    'node_modules/globalize/dist/globalize/message.js',
    'node_modules/globalize/dist/globalize/number.js',
    'node_modules/globalize/dist/globalize/plural.js',
    'node_modules/globalize/dist/globalize/date.js',
    'node_modules/globalize/dist/globalize/currency.js',
    'node_modules/globalize/dist/globalize/relative-time.js',
    'node_modules/globalize/dist/globalize/unit.js',
  ]).pipe(concat('globalize.js'))
    .pipe(gulp.dest(`${dirs.dist}/js/vendor`))
);

gulp.task('copy:license', () =>
  gulp.src('LICENSE.txt')
    .pipe(gulp.dest(dirs.dist))
);

gulp.task('copy:main.css', () => {
  const banner = `/*! HTML5 Boilerplate v${pkg.version} | ${pkg.license} License | ${pkg.homepage} */\n\n`;

  gulp.src(`node_modules/main.css/dist/main.css`)
    .pipe(plugins().header(banner))
    .pipe(plugins().autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9', '> 1%'],
      cascade: false
    }))
    .pipe(gulp.dest(`${dirs.dist}/css`));
});

gulp.task('copy:misc', () =>
  gulp.src([

    // Copy all files
    `${dirs.src}/**/*`,

    // Exclude the following files
    // (other tasks will handle the copying of these files)
    `!${dirs.src}/css/main.css`,
    `!${dirs.src}/index.html`

  ], {

    // Include hidden files by default
    dot: true

  }).pipe(gulp.dest(dirs.dist))
);

gulp.task('copy:normalize', () =>
  gulp.src('node_modules/normalize.css/normalize.css')
    .pipe(gulp.dest(`${dirs.dist}/css`))
);

gulp.task('modernizr', (done) =>{

  modernizr.build(modernizrConfig, (code) => {
    fs.writeFile(`${dirs.dist}/js/vendor/modernizr-${pkg.devDependencies.modernizr}.min.js`, code, done);
  });

});

gulp.task('lint:js', () =>
  gulp.src([
    'gulpfile.js',
    `${dirs.src}/js/*.js`,
    `${dirs.test}/*.js`
  ]).pipe(plugins().jscs())
    .pipe(plugins().eslint())
    .pipe(plugins().eslint.failOnError())
);


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', (done) => {
  runSequence(
    'build',
    'archive:create_archive_dir',
    'archive:zip',
    done);
});

gulp.task('build', (done) => {
  runSequence(
    ['clean', 'lint:js'],
    'copy', 'modernizr',
    done);
});

gulp.task('default', ['build']);
