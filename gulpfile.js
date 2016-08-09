const gulp = require('gulp');
const watch = require('gulp-watch');

const distPath = './dist';

gulp.task('watch', () => {
  return watch(['src/**/*', 'data/**/*'], { ignoreInitial: false })
    .pipe(gulp.dest(distPath));
});

gulp.task('build', ['copy-source', 'copy-data']);

gulp.task('copy-source', () => {
  return gulp.src('./src/**/*')
    .pipe(gulp.dest(distPath));
});

gulp.task('copy-data', () => {
  return gulp.src('./data/**/*')
    .pipe(gulp.dest(distPath));
});
