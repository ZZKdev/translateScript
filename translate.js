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
    var googleUrlCN = 'https://translate.google.cn/translate_a/single?client=webapp&sl=auto&tl=zh-CN&hl=zh-CN&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&source=bh&ssel=0&tsel=0&kc=0&tk=';
    var googleUrlen = 'https://translate.google.cn/translate_a/single?client=webapp&sl=auto&tl=en&hl=zh-CN&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&source=bh&ssel=0&tsel=0&kc=0&tk='
    /*--------google翻译接口求tk模块----使用vq函数获得tk模块----------*/
    function vq(a,uq='422388.3876711001') {
        if (null !== uq)
            var b = uq;
        else {
            b = sq('T');
            var c = sq('K');
            b = [b(), c()];
            b = (uq = window[b.join(c())] || "") || "";
        }
        var d = sq('t');
        c = sq('k');
        d = [d(), c()];
        c = "&" + d.join("") + "=";
        d = b.split(".");
        b = Number(d[0]) || 0;
        for (var e = [], f = 0, g = 0; g < a.length; g++) {
            var l = a.charCodeAt(g);
            128 > l ? e[f++] = l : (2048 > l ? e[f++] = l >> 6 | 192 : (55296 == (l & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023),
        e[f++] = l >> 18 | 240,
        e[f++] = l >> 12 & 63 | 128) : e[f++] = l >> 12 | 224,
                                                                        e[f++] = l >> 6 & 63 | 128),
                                    e[f++] = l & 63 | 128)
        }
        a = b;
        for (f = 0; f < e.length; f++)
            a += e[f],
                a = tq(a, "+-a^+6");
        a = tq(a, "+-3^+b+-f");
        a ^= Number(d[1]) || 0;
        0 > a && (a = (a & 2147483647) + 2147483648);
        a %= 1000000;
        return c + (a.toString() + "." + (a ^ b));
    };
    function sq(a) {
        return function() {
            return a
        }
    };

    function tq(a, b) {
        for (var c = 0; c < b.length - 2; c += 3) {
            var d = b.charAt(c + 2);
            d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d);
            d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
            a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d
        }
        return a
    };
/*---------------------------------------------------求tk模块end--------------*/
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
                ajax(googleUrlen + vq(text) + "&q=", encodeURIComponent(text), 1, container);
            }else {
                if(countOfWord(text) == 1) {
                    ajax(youdaoUrl, text, 0, container);
                }else {
                    ajax(googleUrlCN + vq(text) + "&q=", encodeURIComponent(text), 1, container);
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
        console.log(rst);
        var json = JSON.parse(rst)[0], html = '';
        for (var i = 0; i < json.length - 1; i++) {
            html += json[i][0];
        }
        html = html.replace(/\n/gi, "<br/>");
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
                'background:#000!important;' +
                'font-family:sans-serif,Arial!important;' +
                'font-weight:normal!important;' +
                'text-align:left!important;' +
                'color:#fff!important;' +
                'padding:0.5em 1em!important;' +
                'line-height:1.5em!important;' +
                'border-radius:6px!important;' +
                'border:5px double #ccc!important;' +
                'box-shadow:4px 4px 8px #888!important;' +
                'max-width:350px!important;' +
                'max-height:216px!important;' +
                'z-index:2147483647!important;' +
                'opacity:0.8; ' +
                '');
            return div;
        }
    };// 翻译server结束
})();