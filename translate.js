// ==UserScript==
// @name         超级翻译
// @version      0.1
// @description  划词翻译,自动切换谷歌翻译和有道词典
// @author       zzkdev
// @match        http://*/*
// @include      https://*/*
// @run-at document-end
// @connect      dict.youdao.com
// @connect      translate.google.cn
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    var youdaoUrl = 'http://dict.youdao.com/jsonapi?xmlVersion=5.1&jsonversion=2&q=';
    var googleUrl = 'https://translate.google.cn/translate_a/single?client=gtx&dt=t&dt=bd&dj=1&source=input&hl=zh-CN&sl=auto&tl=';


    document.onmouseup = function(e){
        var text = window.getSelection().toString();
        if(text){
            server.containerDestroy();
            var container = server.container();
            container.style.top = e.pageY + 'px';
            if (e.pageX + 350 <= document.body.clientWidth)// container 面板css最大宽度为250px
                container.style.left = e.pageX + 'px';
            else
                container.style.left = document.body.clientWidth - 350 + 'px';
            document.body.appendChild(container);
            server.rendered.push(container);

            if(isChina(text)) {
                ajax(googleUrl + 'en&q=', encodeURIComponent(text), 1, container);
            }else {
                if(countOfWord(text) == 1) {
                    ajax(youdaoUrl, text, 0, container);
                }else {
                    ajax(googleUrl + 'zh-CN&q=', encodeURIComponent(text), 1, container);
                }
            }
        }
    };

    document.addEventListener("selectionchange", function (e) {
        if (!window.getSelection().toString().trim()) {
            server.containerDestroy();
        }
    });


    function countOfWord(str) {
        var value = String(str);

        value = value.replace(/^\s+|\s+$/gi, ""); // 前后空格不计算为单词数

        value = value.replace(/\s+/gi, " ");// 多个空格替换成一个空格

        var length = 0; // 更新计数
        var match = value.match(/\s/g);//没有匹配到则返回null
        if (match) {
            length = match.length + 1;
        } else if (value) {
            length = 1;
        }
        return length;
    }

    function isChina(str){
        var reg=/^([\u4E00-\u9FA5]|[\uFF00-\uFF20]|[\u3000-\u301C])+$/;
        return !!reg.test(str);
    }
    // ajax 跨域访问公共方法
    function ajax(url, text, target, element, method, data, headers) {
        if (!!!method)
            method = 'GET';
        // >>>因为Tampermonkey跨域访问(a.com)时会自动携带对应域名(a.com)的对应cookie
        // 不会携带当前域名的cookie
        // 所以，GM_xmlhttpRequest【不存在】cookie跨域访问安全性问题
        // 以下设置默认headers不起作用<<<
        url += text;
        if (!!!headers)
            headers = { 'cookie': '' };
        GM_xmlhttpRequest({
            method: method,
            url: url,
            headers: headers,
            data: data,
            onload: function (res) {
                if(target == 0){
                    youdao(res.responseText, text, element);
                }else{
                    google(res.responseText, element);
                }
            },
            onerror: function (res) {
                displaycontainer("连接失败",element);
            }
        });
    }

    // 有道翻译 引擎
    function youdao(rst, text, element) {
        var ec = JSON.parse(rst).ec;
        if (!!ec) {
            var word = JSON.parse(rst).ec.word[0], html = '', tr = '';

            var trs = word.trs, ukphone = word.ukphone, usphone = word.usphone, phone = word.phone;
            var phoneStyle = '' +
            'color:#9E9E9E!important;' +
            '';
            if (!!ukphone && ukphone.length != 0) {
                html += '<span style="' + phoneStyle + '">英[' + ukphone + '] </span>';
            }
            if (!!usphone && usphone.length != 0) {
                html += '<span style="' + phoneStyle + '">美[' + usphone + '] </span>';
            }
            if (html.length != 0) {
                html += '<br />';
            } else if (!!phone && phone.length != 0) {
                html += '<span style="' + phoneStyle + '">[' + phone + '] </span><br />';
            }
            trs.forEach(element => {
                tr += element.tr[0].l.i[0] + '<br />';
            });
            html += tr;
            displaycontainer(html, element);
        }else {
            ajax(googleUrl +'zh-CN&q=', text, 1, element);
        }
    }

    // 谷歌翻译 引擎
    function google(rst, element) {
        var json = JSON.parse(rst), html = '';
        for (var i = 0; i < json.sentences.length; i++) {
            html += json.sentences[i].trans;
        }
        html = html.replace(/\n/gi, "<br/>");
        console.log(html);
        displaycontainer(html, element);
    }

    function displaycontainer(text, element) {
        element.innerHTML = text;
        element.style.display = 'block';// 显示结果
    }

    // 翻译server
    var server = {
        // 存放已经生成的翻译内容面板（销毁的时候用）
        rendered: [],
        // 销毁已经生成的翻译内容面板
        containerDestroy: function () {
            for (var i = this.rendered.length - 1; i >= 0; i--) {
                if (this.rendered[i] && this.rendered[i].parentNode) {
                    this.rendered[i].parentNode.removeChild(this.rendered[i]);
                }
            }
        },
        // 生成翻译结果面板 DOM （此时还未添加到页面）
        container: function () {
            var div = document.createElement('div');
            div.setAttribute('style', '' +
                'display:none!important;' +
                'position:absolute!important;' +
                'font-size:15px!important;' +
                'overflow:auto!important;' +
                'background:#fff!important;' +
                'font-family:sans-serif,Arial!important;' +
                'font-weight:normal!important;' +
                'text-align:left!important;' +
                'color:#000!important;' +
                'padding:0.5em 1em!important;' +
                'line-height:1.5em!important;' +
                'border-radius:5px!important;' +
                'border:1px solid #ccc!important;' +
                'box-shadow:4px 4px 8px #888!important;' +
                'max-width:350px!important;' +
                'max-height:216px!important;' +
                'z-index:2147483647!important;' +
                '');
            return div;
        }
    };// 翻译server结束
})();