# waybo
A simple web-weibo base on nodejs.

## 应用截图
![程序截图](https://raw.github.com/sdg-sysdev/waybo/master/public/assets/images/ScreenShot1.png)    
![程序截图](https://raw.github.com/sdg-sysdev/waybo/master/public/assets/images/ScreenShot2.png)  
![程序截图](https://raw.github.com/sdg-sysdev/waybo/master/public/assets/images/ScreenShot3.png)

## 安装部署  

```sh  
$ git clone https://github.com/sdg-sysdev/waybo.git   
$ cd waybo  
$ npm install  
$ node app.js
```  
或者  
```sh
$ npm install waybo   
$ cd waybo  
$ node app.js
```  
或者  
```bash
// 安装 [node-webkit](https://github.com/rogerwang/node-webkit)
$ make dev
```

## 说明
* 应用目前还未通过审核，不能大范围推广（无法随意使用自己的帐号），在此提供一个测试帐号来测试：```qatest2@163.com 123456789```。也可以通过该帐号先登录微博，[并手动添加一个测试帐号](http://open.weibo.com/apps/2645619356/info/test)
* 为了确保可以正常登录，在登录前请先退出[新浪微博](http://t.sina.com.cn/logout.php?backurl=/)


## Resources  
* [https://github.com/samxxu/node-sina-weibo](https://github.com/samxxu/node-sina-weibo)  
* [https://github.com/fengmk2/node-weibo](https://github.com/fengmk2/node-weibo)  
* [https://github.com/substack/node-browserify](https://github.com/substack/node-browserify)  
* [node-webkit](https://github.com/rogerwang/node-webkit)  
* [https://github.com/rockdai/WeiboAPI](https://github.com/rockdai/WeiboAPI)  


## License 

(The MIT License)

Copyright (c) 2011-2012 nomospace

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
