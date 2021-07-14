// using web sessionStorage
// function saveState(pageNum){
//     if(window.sessionStorage){
//         window.sessionStorage.setItem("pageNum", pageNum);
//     }
// }
// let pageNum = parseInt(window.sessionStorage.getItem("pageNum"));
// window.addEventListener("beforeunload", function(e){
//     saveState(pageNum);
// })


function showNavButton(pageNum, lastNum, prevButton, nextButton){
    if(lastNum == 1){
        prevButton.style.display = "none";
        nextButton.style.display = "none";
    }
    else if(pageNum == 1 && lastNum > 1){
        prevButton.style.display = "none";
        nextButton.style.display = "inline";
    }
    else if(pageNum > 1 && pageNum == lastNum){
        prevButton.style.display = "inline";
        nextButton.style.display = "none";
    }
    else {
        prevButton.style.display = "inline";
        nextButton.style.display = "inline";
    }
}

function parseUrlParameters(){
    let urlParameters = window.location.search;
    let res = {};

    if(urlParameters.indexOf("?") != -1){
        keyValuePairs = urlParameters.substr(1).split("&");

        for(kv of keyValuePairs){
            [k, v] = kv.split("=");
            res[k] = decodeURI(v);      //解析中文字符
        }

        if(!res["tag"])
            res["tag"] = "all";
        if(!res["page"])
            res["page"] = "1";
    }
    else{
        res["tag"] = "all";
        res["page"] =  "1";
    }

    return res;
}

function articleQuery(tagQuery){
    let queryRes = [];

    if(tagQuery == "all")
        queryRes = articlesDB;
    else{
        for(article of articlesDB){
            if(!article["tags"])
                continue
            if(article["tags"].indexOf(tagQuery) != -1)
                queryRes.push(article);
        }
    }

    return queryRes;
}

function clearContent(){
    let ol = document.getElementById("articles");
    let lis = document.querySelectorAll("li");
    
    for(li of lis){
        ol.removeChild(li);
    }
}

function updateContent(){
    clearContent();

    kvs = parseUrlParameters();
    tagQuery = kvs["tag"];
    pageNum = parseInt(kvs["page"]);

    h1Title = document.getElementById("h1Title");
    if(tagQuery == "all"){
        h1Title.innerHTML = "Articles";
    }
    else{
        h1Title.innerHTML = "Articles for tag #" + tagQuery;
    }

    let ol = document.getElementById("articles");
    ol.setAttribute("start", 1 + (pageNum-1)*15);

    for(i = 1 + (pageNum-1)*15; i < 1 + pageNum*15; i++){
        if(i > totalArticles)
            break;
        
        let li = document.createElement("li");
        li.setAttribute("class", "blog-item");
    
        let a = document.createElement("a");
    
        ol.appendChild(li);
        li.appendChild(a);

        articleDate = articleList[i-1].date;
        articleName = articleList[i-1].name;
        articleFileName = articleList[i-1].fileName;
    
        a.setAttribute("href", "blogs/"+articleFileName);
        a.innerHTML = articleDate + " " + articleName;
    }
}


function setPageUrl(pageNum){
    url = window.location.origin + window.location.pathname;
    //url = "file://" + window.location.pathname;
    
    let para = ""
    if(tagQuery !== "all")
        para = "?tag=" + tagQuery;
    
    if(para == "" && pageNum > 1)
        para += "?page=" + pageNum;
    else if(para != "" && pageNum > 1)
        para += "&page=" + pageNum;

    window.location.href = url + para;
}

function init(){
    updateContent();
    showNavButton(pageNum, lastNum, prevButton, nextButton);
}


let kvs = parseUrlParameters();
let tagQuery = kvs["tag"];
let pageNum = parseInt(kvs["page"]);

let articleList = articleQuery(tagQuery);
let totalArticles = articleList.length;

let lastNum = Math.ceil(totalArticles/15);

let prevButton = document.getElementById("prevB");
let nextButton = document.getElementById("nextB");

init();

prevButton.addEventListener("click", function(e){
    pageNum--;
    setPageUrl(pageNum);
    init();
})

nextButton.addEventListener("click", function(e){
    pageNum++;
    setPageUrl(pageNum);
    init();
})


