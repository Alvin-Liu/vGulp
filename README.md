> 项目不打算继续更新了，是很早之前写的，有很多bug，不推荐使用。本来已经删除了，放上来主要为了给自己留个纪念

vGulp介绍：[前端自动化工具vGulp](http://www.limon.space/2017/%E5%89%8D%E7%AB%AF%E8%87%AA%E5%8A%A8%E5%8C%96%E5%B7%A5%E5%85%B7vGulp/ "前端自动化工具vGulp")

## 关于vGulp

vGulp基于Gulp 3.9.1开发而成，用于处理前端项目文件的编译、压缩、合并、打包工作。HTML使用ejs模板编译而成，可根据自定义的语言包和命令编译成不同语言的HTML文件；css使用sass预处理编译而成，自动添加-webkit-、-moz-、-ms-等前缀；JS没有做过多处理，可以根据个人需要在gulpfile.js文件中添加JSLint或ESLint等。

什么情况下可以使用vGulp:

- F5键坏了，手指不够长，懒...
- Apaphe等环境下修改文件，找不到合适的自动刷新工具
- 开发多语言版本的网站页面等

### vGulp使用方法

1.安装Node.js,安装Gulp（Node.js安装方法请自行搜索，[Gulp入门](http://www.gulpjs.com.cn/docs/getting-started/ "Gulp入门")）：

```
$ npm install --global gulp		// 全局安装
$ npm install --save-dev gulp	// 作为项目的开发依赖
```

2.克隆或者下载本项目，github地址：[https://github.com/Alvin-Liu/vGulp](https://github.com/Alvin-Liu/vGulp "Alvin-Liu")：

```
$ git clone https://github.com/Alvin-Liu/vGulp.git
```

3.安装模块依赖：	

```
npm install
```

4.根据需要简单配置自己的config.json，示例代码：
	
```
{
    "project" : "vGulp",	// 项目名   
    "src": {	// 源文件目录
        "ejs": "src/ejs", 
        "sass": "src/sass",
        "images": "src/images",
        "js": "src/js",
        "css": "src/css", 
        "source": "src/source", 	//  其他文件，如视频，音乐，字体等
        "data": "language/data.json" 	// 语言包路径
    },
    "dist": {	// 打包后文件目录
        "html": "html",
        "js": "static/js",
        "css": "static/css",
        "images": "static/images",
        "source": "static/source"
    },
    "localserver" : {	// 本地服务器
        "baseDir" : "src",	//	网站根目录
        "port" : "8081",	//  端口
        "proxy": false,		//  时候启用代理
        "target": "127.0.0.1"	// 代理地址
    },
    "lang":["zh","en"],		// 语言种类，HTML代码将编译到对应的文件夹中
	"data_use": 1,			// 指定data.json文件用那一种方式,目前可选0或者1,请看注意事项
    "displayInfo": false,	// 是否启用文件头部追加内容
    "pkg": {	// 追加内容模板请在gulpfile.js中修改
        "author":"",		
        "description":"",
        "version":"1.0.0",
        "homepage":"#",
        "license":""
    },
    "replaceWord": {	// 全局关键字替换
        "html": {
            "origin": "../",
            "dist": "../../static/"
        },
        "js": {
            "origin": "",
            "dist": ""
        },
        "css": {
            "origin": "",
            "dist": ""
        }
    },
    "concatCssFiles": {	// css合并，暂时只支持一个
        "filename": "init.min.css",		// 合并后的文件名
        "folder": "common",		// 合并该文件夹中的内容
        "files": ["init.css","header.css"]	//  指定合并后的文件的先后顺序
    },
    "concatJsFiles": {	// js合并
        "filename": "global.min.js",
        "folder": "common",
        "files": ["b.js","a.js"]
    }      
}
```

5.根据需要修改gulpfile.js(请尽量熟悉vGulp之后再尝试);

6.执行gulp任务：

```
gulp help   // gulp参数说明
gulp        // 开发，添加命令 --lang= 可以指定语言，例：gulp --lang=en
gulp build  // 打包
gulp ejs    // ejs模板编译
gulp sass   // sass编译
gulp js     // js合并
gulp clean  // 清理无用文件
gulp watch  // 监听文件改变
```

### 特别说明

1.在命令后添加 --lang=en 或者 --lang= 指定语言版本，可以执行该语言对应的命令操作，如：

```
gulp build --lang=en  // 只会打包en语言下的HTML文件
``` 

2.多语言时,有两种方法应用页面数据,根据个人喜欢在config.json中配置data_use为0或者1;

- data_use为0时，一个语言对应一个文件夹，且一个页面对应一个文件夹中的一个文件，如：index.ejs的数据对应index.json。使用该方式时，请先修改data文件的引用路径为 'language' ,不要指定具体的文件名;
- data_use为1时(默认),所有文件对应同一个json文件，config中data.json文件的引用指定到具体的文件名。

3.多语言时,同一个页面由于字体长度等原因显示会有所差别，此时可以另外引入单独的针对该文件的css代码，所有ejs页面中都可以引用`_lang`这一全局变量，进行指定语言引入指定内容，如参考代码中的内容：

```
<%# 只有当语言为'zh'时,引入文件zh.css %>
<% if(_lang='zh'){ %>	
	<%- include('extra/zh.css') %>
<% } %>
```