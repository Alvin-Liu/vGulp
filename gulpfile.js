"use strict"

const gulp = require('gulp'),
    path = require('path'),
    fs = require('fs'),
    argv = require('yargs').argv,
    $ = require('gulp-load-plugins')(),
    pngquant = require('imagemin-pngquant'),
    config = require('./config.json'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;
// 头部信息
const pkg = config.pkg,
    banner = ['/**',
        ' * @author: <%= pkg.author %>',
        ' * @description: <%= pkg.description %>',
        ' * @version: v<%= pkg.version %>',
        ' * @homepage: <%= pkg.homepage %>',
        ' * @license: <%= pkg.license %>',
        ' */',
        ''].join('\n'),
    lang = argv.lang || 'zh',
    src = config.src,
    dist = config.dist;

// 任务，将根据key值生成 gulp 任务
const tasks = {
    ejs: function() {   // ejs 模板编译
        return gulp.src(src.ejs + '/*.ejs')
            .pipe($.data(function (file) {
                const filePath = file.path;
                if(config.data_use == 0) {
                    /* 方式一：一个页面对应一个json，另外定义一个全局的global.json文件 */
                    const cur = src.data + '/' + lang + '/' + path.basename(filePath, '.html') + '.json';
                    let global_json = {};
                    if(fs.existsSync(src.data + '/global.json')) {
                        global_json = {global: JSON.parse(fs.readFileSync(src.data + '/global.json'))}
                    } else {
                        throw src.data + '/global.json 文件不存在';
                    }
                    return fs.existsSync(cur) ? Object.assign(global_json, JSON.parse(fs.readFileSync(cur)), {_lang:lang}) : global_json
                } else {
                    /* 方式二：所有页面使用同一个data.json文件 */
                    if(fs.existsSync(src.data)) {
                        let json_data = JSON.parse(fs.readFileSync(src.data))[lang];
                        return Object.assign({global: json_data['global']}, json_data[path.basename(filePath, '.ejs')], {_lang:lang});
                    } else {
                        throw src.data + '文件不存在';
                    }
                }
            }))
            .pipe($.ejs({},{},{ext: '.html'}).on('error', function(err) {
                $.util.log(err);
                this.emit('end');
            }))
            .pipe(gulp.dest('src/' + lang))
            .pipe(reload({stream:true}));
    },
    sass: function() { // SASS 代码编译、合并
        const concatCss = config.concatCssFiles,
            files = concatCss.files.map(function(item) {
                return '**/'+concatCss.folder+'/' + item;
            }),
            f = $.filter(files,{restore: true});
        return gulp.src(src.sass + '/**')
            .pipe($.plumber())
            .pipe($.sass())
            .pipe(f)
            .pipe($.order(files))
            .pipe($.concat(concatCss.filename))
            .pipe(f.restore)
            .pipe($.filter(src.sass + '/*.css'))
            .pipe($.autoprefixer({
                browsers: ['last 2 versions','Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=20'],
                cascade: false, //是否美化属性值 默认：true 像这样:
                //-webkit-transform: rotate(45deg);
                //        transform: rotate(45deg);
                remove:true //是否去掉不必要的前缀 默认：true
            }))
            .pipe(gulp.dest(src.css))
            .pipe(reload({stream:true}));
    },
    js: function() {    // js
        const concatJs = config.concatJsFiles,
            files = concatJs.files.map(function(item) {
                return '**/'+concatJs.folder+'/' + item;
            });
        return gulp.src(files)
            .pipe($.order(files))
            .pipe($.concat(concatJs.filename))
            .pipe(gulp.dest(src.js))
            .pipe(reload({stream:true}));
    },
    clean: function() { // 文件删除
        return gulp.src(['.sass-cache',dist.html])
            .pipe($.clean({force: true}))
            .pipe(gulp.dest('clean'));
    },
    watch: function() {     // 文件监控
        gulp.watch(src.sass + '/**', ['sass']);
        gulp.watch([src.data,src.ejs + '/**'], ['ejs']);
        // gulp.watch([src.data + '/**',src.ejs + '/**'], ['ejs']);
        gulp.watch(src.js + '/**', ['js']);
        gulp.watch(src.images + '/**').on('change', reload);
    }
};
// 生成 gulp 任务
Object.keys(tasks).forEach(function(key) {
    gulp.task(key, function() {
        return tasks[key]()
    });
});
// 打包
const build = {
    html: function() {
        const replace = {
                origin: config.replaceWord.html.origin,
                dist: config.replaceWord.html.dist
            },
            options = {
                removeComments: true,//清除HTML注释
                collapseWhitespace: true,//压缩HTML
                collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
                removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
                removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
                removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
                minifyJS: true,//压缩页面JS
                minifyCSS: true//压缩页面CSS
            },
            html = config.lang.map(function(item) {
                return 'src/'+item + '/**';
            }),
            f = $.filter(html);
        return gulp.src('src/**/*.html')
            .pipe(f)
            .pipe($.replace(replace.origin,replace.dist))     //- 执行文件内css名的替换
            .pipe($.htmlmin(options))
            .pipe($.if(config.displayInfo, $.header(banner, { pkg : pkg } )))
            .pipe(gulp.dest(dist.html)); 
    },
    js: function() {
        const replace = {
                origin: config.replaceWord.js.origin,
                dist: config.replaceWord.js.dist
            };
        return gulp.src(src.js + '/*.js')   // 只复制根目录
            .pipe($.replace(replace.origin,replace.dist))
            .pipe($.uglify())
            .pipe($.if(config.displayInfo, $.header(banner, { pkg : pkg } )))
            .pipe(gulp.dest(dist.js));
    },
    css: function() {
        const replace = {
                origin: config.replaceWord.css.origin,
                dist: config.replaceWord.css.dist
            },
            timestamp = +new Date();
        return gulp.src(src.css + '/**')
            .pipe($.cssSpriter({
                // 生成的spriter的位置
                'spriteSheet': dist.images + '/sprite_'+timestamp+'.png',
                // 生成样式文件图片引用地址的路径
                // 如下将生产：backgound:url(../images/sprite20324232.png)
                'pathToSpriteSheetFromCSS': '../images/sprite_'+timestamp+'.png'
            }))
            .pipe($.cleanCss())
            .pipe($.replace(replace.origin,replace.dist))
            .pipe($.if(config.displayInfo, $.header(banner, { pkg : pkg } )))
            .pipe(gulp.dest(dist.css));
    },
    img: function() {
        return gulp.src(src.images)
            .pipe($.imagemin({ 
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()]
            }))
            .pipe(gulp.dest(dist.images));
    },
    other: function() {
        return gulp.src(src.source)
            .pipe(gulp.dest(dist.source));
    }
};
//默认任务
gulp.task('default', ['sass', 'ejs', 'js', 'watch'], function() {
    const s = config.localserver,
        options = {
            startPath: lang,
            port: s.port,
            reloadDebounce: 0
        },
        proxy = {   // 代理
            target: s.target
        },
        server = {  // 静态
            baseDir: s.baseDir
        },
        opt = s.proxy ? {proxy:proxy} : {server:server};
    Object.assign(options,opt);
    browserSync.init(options);
    console.log('请开始编写你的代码！');
});
//将相关项目文件复制到dist 文件夹下 并压缩
gulp.task('build', ['sass', 'ejs', 'js', 'clean'], function(){
    for(let key in build) {
        build[key]();
    }
    console.log('正在打包你的代码！');
});
gulp.task('help',function () {
    console.log('gulp任务命令：')
    console.log('    gulp help     gulp参数说明');
    console.log('    gulp          开发，添加命令 --lang= 可以指定语言，例：gulp --lang=en');
    console.log('    gulp build    打包');
    console.log('    gulp ejs      ejs模板编译');
    console.log('    gulp sass     sass编译');
    console.log('    gulp js       js合并');
    console.log('    gulp clean    清理无用文件');
    console.log('    gulp watch    监听文件改变');
});
