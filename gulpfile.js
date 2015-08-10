var gulp = require('gulp');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');

gulp.task('css', function() {
  return gulp.src('src/*.css').pipe(minifyCss()).pipe(gulp.dest('dist'));
});

gulp.task('js', function() {
  return gulp.src('src/*.js').pipe(uglify()).pipe(gulp.dest('dist'));
});

gulp.task('default',['css','js']);
