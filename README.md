# longfei-chen.github.io
Long-Fei Chen's GitHub Pages

## 如何使用这个模板
1. 把文章的html文件放在./blogs目录下。
2. 在./assets/articleJSON.js中添加该文章的相关信息。由于不会对文章进行排序，所以最好把新添加的文章放在最开始。需要添加的相关信息如下：
```javascript
let articlesDB = [ 
    {                               //这是要添加的信息
        "date": "2021-07-14",       //这是要添加的信息
        "name": "我的文章题目",      //这是要添加的信息
        "fileName": "test.html",    //这是要添加的信息
        "tags": ["test", "中文"],   //这是要添加的信息
    },                              //这是要添加的信息
    ...
```
3. 完成。