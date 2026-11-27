// ==UserScript==
// @name         网络干部学院
// @namespace    http://tampermonkey.net/
// @version      2026-07-13
// @description  try to take over the world!
// @author       You
// @match        https://www.qdgbjy.gov.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qdgbjy.gov.cn
// @updateURL    https://gitee.com/zealotsparc/utils/raw/master/网络干部学院.user.js
// @downloadURL  https://gitee.com/zealotsparc/utils/raw/master/网络干部学院.user.js
// @grant        GM_openInTab
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const sleep = ms => new Promise( resolve=> setTimeout( resolve , ms ) );

    function localeTimeStr(){

        const now = new Date();

        // 获取时、分、秒（转换为字符串并补零）
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        // 拼接为常用格式
        const rslt = `${h}:${m}:${s}`;
        return rslt;
        //console.log(currentTime); // 输出示例: "14:05:09"
    }

    /**
     * 等待指定选择器的元素出现
     * @param {string} selector - CSS 选择器
     * @returns {Promise<Element>}
     */
    function waitForElementAppear(selector) {
        return new Promise((resolve) => {
            // 1. 如果元素已经存在，直接返回
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }

            // 2. 如果不存在，创建监听器观察 DOM 树
            const observer = new MutationObserver((mutations, me) => {
                const target = document.querySelector(selector);
                if (target) {
                    me.disconnect(); // 找到后立即停止监听，释放内存
                    resolve(target);
                }
            });

            // 开始监听整个网页的节点变化
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    /**
     * 等待指定选择器的元素从页面消失
     * @param {string} selector - CSS 选择器
     * @returns {Promise<void>}
     */
    function waitForElementRemove(selector) {
        return new Promise((resolve) => {
            // 1. 如果元素本来就不存在，直接返回
            if (!document.querySelector(selector)) {
                return resolve();
            }

            // 2. 创建监听器
            const observer = new MutationObserver((mutations, me) => {
                const target = document.querySelector(selector);
                //特殊处理 ElementUI：有些弹窗消失并不是删除了节点，而是加上了 display: none
                const isHidden = target && (target.style.display === 'none' || target.closest('[style*="display: none"]'));

                if (!target || isHidden) {
                    me.disconnect(); //消失后停止监听
                    resolve();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true, // 必须监听属性变化，才能捕捉到 style="display:none"
                attributeFilter: ['style', 'class']
            });
        });
    }
    // 等待节点属性出现
    async function waitForElementStatusAppear( dom , status , value ){
        do{
            await sleep( 100 );
            const s = dom.getAttribute( status )
            if( s && s.includes( value ) ){
                // 如果属性存在且包含value则等待完成
                break;
            }
        }while(true);
    }
    // 等待节点属性消失
    async function waitForElementStatusRemove( dom , status , value ){
        do{
            await sleep( 100 );
            const s = dom.getAttribute( status );
            if ( !s || !s.includes(value) ){
                // 如果属性消失或不含value则等待完成
                break;
            }
        }while( true );
    }

    // 封装：打开新页面并等待其关闭的 Promise 函数
    async function openTabAndWaitingForClose(url) {
        return new Promise((resolve) => {
            console.log(`正在打开页面: ${url}`);

            // 1. 打开新标签页（active: true 表示立即切换过去）
            const myTab = GM_openInTab(url, { active: true, insert: true, setParent: true });

            // 2. 监听新标签页的关闭事件
            if (myTab && typeof myTab.onclose === 'function') {
                myTab.onclose = () => {
                    console.log('页面已被关闭');
                    resolve(); // 触发 Promise 完成
                };
            } else {
                // 兜底方案：如果某些旧版本油猴不支持 onclose 回调，改用定时器轮询检查
                const timer = setInterval(() => {
                    if (myTab && myTab.closed) {
                        clearInterval(timer);
                        console.log('页面已被关闭');
                        resolve();
                    }
                }, 1000);
            }
        });
    }

    function thisHTML( dom ){
        const clone = dom.cloneNode( false );
        return clone.outerHTML;
    }

    async function learnProc1(){
        if( GM_getValue("re",0 )>=5 ){
            return;
        }
        console.log("1.  普通视频 " + localeTimeStr() );
        //https://www.qdgbjy.gov.cn/detail/3bc29912-712f-4ae2-aa4a-347f95c2b1d5#/
        const nodes = document.querySelectorAll( 'div.tab-contentOne > div > div.t1-cell' );
        for( let node of nodes ){
            const node_name = node.querySelector('.t1-cell-title');
            const node_rate = node.querySelector('.t1-cell-progress > span');

            console.log( "1.1 课程章节 " + node_name.textContent );

            if( node_rate.textContent.includes("100%") ){
                console.log( "1.2 跳过章节 ");
                continue;
            }

            const rClick = new MouseEvent('contextmenu', {
                bubbles: true,// 允许事件冒泡
                cancelable: true,// 允许取消事件
                buttons: 2,// 2 代表右键
                button: 2// 2 代表右键
            });

            // 开始播放
            let re = 0;
            do{
                // 点击章节
                node_name.click();
                await sleep( 1000 );
                node_name.click();
                await sleep( 9000 );

                const node_xp = document.querySelector("#vedio-area");
                node_xp.dispatchEvent(rClick);

                // 点击开始
                const node_play = document.querySelector('xg-start.xgplayer-start');
                node_play.click();
                await sleep( 5000 );
                node_xp.dispatchEvent(rClick);

                if( node_xp && node_xp.classList.contains("xgplayer-playing") ){
                    break;
                }
                // 尝试播放失败次数大于5次则终止
                re = re + 1;
                if( re>=5 ){
                    return;
                }
            }while( true );
            console.log( "1.2 开始播放 " + localeTimeStr() );

            // 等待完成
            let sval = "";
            let nump = 0;
            do{
                // 如果进度到达百分百，则播放完毕
                if( node_rate.textContent.includes("100%") ){
                    break;
                }

                const node_xp = document.querySelector("#vedio-area");
                if( node_xp && node_xp.classList.contains("xgplayer-is-error") )
                {
                    // 点击开始
                    const node_r = document.querySelector('xg-error.xgplayer-error');
                    node_r.click();
                }

                // 五分钟进度没有更新，则刷新网页
                nump = nump + 5;
                if( nump%300 === 0 ){
                    if ( sval == node_rate.textContent ){
                        // 刷新尝试次数最多5次
                        let re = GM_getValue("re",0 );
                        if( re>=3 ){
                            return;
                        }else{
                            GM_setValue("re",re+1);
                        }

                        location.reload();
                    }
                    sval = node_rate.textContent
                }

                // 如果出现刷新按钮，则点击
                await sleep( 5000 );

            }while( true );

            console.log( "1.3 播放完毕 " + localeTimeStr() );


        }
    }

    async function learnProc2(){
        if( GM_getValue("re",0 )>=5 ){
            return;
        }
        console.log("2.  内嵌视频 " + localeTimeStr() );

        //https://www.qdgbjy.gov.cn/detailThere/5c22b32a-e746-4a47-bb74-b2dbc4a65450#/
        const nodes = document.querySelectorAll( 'div.tab-contentOne > div > div.t1-cell' );
        for( let node of nodes ){
            const node_name = node.querySelector('.t1-cell-title');
            const node_rate = node.querySelector('.t1-cell-progress > span');

            console.log( "2.1 课程章节 " + node_name.textContent );

            if( node_rate.textContent.includes("100%") ){
                console.log( "2.2 跳过章节");
                continue;
            }

            // 开始播放
            do{
                node_name.click();
                await sleep( 1000 );
                node_name.click();
                await sleep( 5000 );

                const nodep = document.querySelector('iframe');
                const nodepdoc = nodep.contentDocument || nodep.contentWindow.document;

                const node_play = nodepdoc.querySelector('.user_choise');
                node_play.click();
                await sleep( 5000 );

                const node_xp = nodepdoc.querySelector('#course_player');
                node_xp.click();
                if( node_xp && node_xp.getAttribute("src")!=null ){
                    break;
                }

            }while( true );
            console.log( "2.2 开始播放 " + localeTimeStr() );

            // 等待完成
            let sval = "";
            let nump = 0;
            do{
                // 如果进度到达百分百，则播放完毕
                if( node_rate.textContent.includes("100%") ){
                    break;
                }

                // 五分钟进度没有更新，则刷新网页
                nump = nump + 5;
                if( nump%300 === 0 ){
                    if ( sval == node_rate.textContent ){
                        // 刷新尝试次数最多5次
                        let re = GM_getValue("re",0 );
                        if( re>=3 ){
                            return;
                        }else{
                            GM_setValue("re",re+1);
                        }

                        location.reload();
                    }
                    sval = node_rate.textContent
                }

                // 如果出现刷新按钮，则点击
                await sleep( 5000 );

            }while( true );

            console.log( "2.3 播放完毕 " + localeTimeStr());
        }
    }

    async function learnProc3(){
        if( GM_getValue("re",0 )>=5 ){
            return;
        }
        console.log("3.  内嵌书籍 " + localeTimeStr() );
        //https://www.qdgbjy.gov.cn/detailThere/538e05c1-0333-49bf-ad13-8cff81c5aba0#/
        const nodes = document.querySelectorAll( 'div.tab-contentOne > div > div.t1-cell' );
        for( let node of nodes ){
            const node_name = node.querySelector('.t1-cell-title');
            const node_rate = node.querySelector('.t1-cell-progress > span');

            console.log( "3.1 课程章节 " + node_name.textContent );

            if( node_rate.textContent.includes("100%") ){
                console.log( "3.2 跳过章节 ");
                continue;
            }

            console.log( "3.2 开始学习 " + localeTimeStr() );

            do{
                node_name.click();
                await sleep( 9000 );

                break;

            }while( true );

            // 等待完成
            let sval = "";
            let nump = 0;
            do{
                // 如果进度到达百分百，则播放完毕
                if( node_rate.textContent.includes("100%") ){
                    break;
                }

                // 五分钟进度没有更新，则刷新网页
                nump = nump + 5;
                // 书籍类课程不要触发刷新
                /*
                if( nump%300 === 0 ){
                    if ( sval == node_rate.textContent ){
                        // 刷新尝试次数最多5次
                        let re = GM_getValue("re",0 );
                        if( re>=3 ){
                            return;
                        }else{
                            GM_setValue("re",re+1);
                        }

                        location.reload();
                    }
                    sval = node_rate.textContent
                }*/

                const nodep = document.querySelector('iframe');
                const nodepdoc = nodep.contentDocument || nodep.contentWindow.document;

                // 两分钟执行一次翻页
                if( nump%60 === 0 ){
                    console.log("3.3 执行翻页 " + localeTimeStr());
                    // 1. 获取目标节点
                    const book = nodepdoc.querySelector("#bookContainer > .book" );
                    const bars = nodepdoc.querySelector("#fbToolBar" );

                    // 1. 找出所有带有 button 类名的 div
                    const btns = bars.querySelectorAll('div.button');

                    for( let btn of btns ){
                        if( btn.textContent.includes('下一页') ){
                            btn.click();
                            break;
                        }
                    }

                }

                // 如果出现刷新按钮，则点击
                await sleep( 5000 );

            }while( true );

            console.log(" 3.4 学习完成 " + localeTimeStr() );
        }
    }

    async function learn_Course(){

        console.log(localeTimeStr() + " learn_Course");
        // 延迟10秒
        let counter = 0;
        do{
            counter = counter + 1;
            if (counter==10){
                break;
            }
            await sleep(1000);
        }while( true );

        console.log("0.  重试次数 re=" , GM_getValue("re",0 ) );

        // 根据类型选择学习程序
        const nodep = document.querySelector('iframe');
        if( !nodep ){
            await learnProc1();
        }
        else{
            const nodeDoc = nodep.contentDocument || nodep.contentWindow.document;

            const bookContainer = nodeDoc.getElementById('bookContainer');
            if( bookContainer ){
                await learnProc3();
            }
            else{
                await learnProc2();
            }
        }

        // 学习完成,关闭页面
        await sleep( 5000 );
        console.log(localeTimeStr() + " learn_Course...Done");
        window.close();
    }

    function watchWindowClose(win) {
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                // 当窗口被用户手动关闭，或者被代码 win.close() 关闭时，win.closed 会变成 true
                if (win.closed) {
                    clearInterval(timer); // 清除定时器
                    resolve(); // 触发 Promise 完成
                }
            }, 500); // 每 500 毫秒（0.5秒）检查一次
        });
    }

    function showLOG( dom , value , lt=true , br=true ){
        // 1. 创建 span 元素
        const mySpan = document.createElement('span');

        // 2. 设置它的文字内容
        if( lt ){
            mySpan.textContent = localeTimeStr() + " " + value;
        } else {
            mySpan.textContent = value;
        }
        mySpan.style.color = '#00FF88';
        mySpan.style.fontSize = '24px';
        mySpan.style.fontFamily = "Consolas";
        mySpan.style.display = 'inline-block';
        mySpan.style.padding = '0px 0px';

        // 3. 将它添加到页面的某个容器中（例如 body）
        dom.appendChild(mySpan);

        if ( br ){
            const br = document.createElement('br');
            dom.appendChild(br);
        }
    }

    async function handleCourse(){

        let interceptedUrl = null;
        let myWindowHandle = null;

        // 1. 核心：在页面刚开始加载时，潜伏并重写底层的 window.open
        // 核心修改：利用 unsafeWindow 穿透油猴沙箱，直接改写网页最底层的真实 window.open
        const REAL_WINDOW = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        const originalWindowOpen = REAL_WINDOW.open;
        REAL_WINDOW.open = function(url, target, features) {
            console.log(localeTimeStr() + " handleCourse...3.捕获地址:" , url );
            // 调用原生方法打开新窗口，并扣留句柄
            interceptedUrl = url; // 成功把地址记录下来
            return null;
        };

        alert("\n学习过程中不要在当前网页进行任何操作... \n\n准备完毕点击确定开始学习.");
        navbarSwitch( false );

        // 1. 创建 div 元素
        const maskDiv = document.createElement('div');
        if( true ){
            // 2. 设置全屏样式与层级
            maskDiv.style.position = 'fixed';
            maskDiv.style.top = '0';
            maskDiv.style.left = '0';
            maskDiv.style.width = '100vw';
            maskDiv.style.height = '100vh';
            maskDiv.style.padding = "10px 20px";
            maskDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // 半透明黑色背景（可根据需求修改）
            maskDiv.style.zIndex = '999999'; // 确保层级高于页面所有元素

            showLOG( maskDiv , '自动学习期间不要操作和刷新该页面...' );

            // 3. 添加到页面中
            document.body.appendChild(maskDiv);
        }

        let lesson_list = [];

        const lessons = document.querySelectorAll(".user_my_main_body_ul_item");
        console.log(localeTimeStr() + " handleCourse...0.课程数量:", lessons.length );

        for (let lesson of lessons) {
            await sleep(2000); // 增大等待时间，留给页面足够的响应缓冲
            const node_name = lesson.querySelector(".user_my_main_body_ul_li_1 > .user_my_main_body_ul_li_1_title");
            const node_score = lesson.querySelector(".user_my_main_body_ul_li_1 > .user_my_main_body_ul_li_1_msg > .msg_all0 > .msg_1 > span");

            if (!node_name) continue;
            console.log(localeTimeStr() + " handleCourse...1.处理课程:", node_name.textContent);
            showLOG( maskDiv , '学习课程：'+node_name.textContent , true , false );

            if( lesson_list.includes(node_name.textContent) ){
               continue;
            }

            lesson_list.push( node_name.textContent );

            // 设置重试次数
            GM_setValue("re" , 0 );
            // 每次循环前，初始化状态
            interceptedUrl = null;
            myWindowHandle = null;

            // 💡 核心升级：增加点击重试循环（对抗浏览器的静默拦截和网页异步延迟）
            console.log(localeTimeStr() + " handleCourse...2.模拟点击");
            node_name.click();
            // 延长点击后的等待时间，确保 Vue 内存逻辑完成 window.open
            await sleep(1000);

            // 再次判断
            if (interceptedUrl) {

                console.log(localeTimeStr() + " handleCourse...4.打开页面");

                // 由油猴脚本显式调用原始方法打开，此时获得的句柄百分之百有效、不丢
                const params = new URLSearchParams();
                params.append('a', '1');
                const newUrl = interceptedUrl + (interceptedUrl.includes('?') ? '&' : '?') + params.toString();

                myWindowHandle = originalWindowOpen(newUrl, '_blank');

                if (myWindowHandle) {
                    console.log(localeTimeStr() + " handleCourse...5.等待关闭");
                    await watchWindowClose(myWindowHandle);

                    console.log(localeTimeStr() + " handleCourse...6.页面关闭");
                    await sleep(1000); // 稳定缓冲 1.5 秒
                } else {
                    console.log(localeTimeStr() + " handleCourse...E.弹窗阻止");
                }

            } else {
                console.log(localeTimeStr() + " handleCourse...E.未能捕获");
            }

            console.log(localeTimeStr() + " handleCourse...7.处理完毕");
            showLOG( maskDiv , "..." + node_score.textContent , false , true );
        }

        REAL_WINDOW.open = originalWindowOpen;
    }

    const learnButton = document.createElement('button');
    learnButton.innerText = '开始学习';
    //learnButton.style.position = 'fixed';
    //learnButton.style.top = '110px';
    //learnButton.style.right = '40px';
    //learnButton.style.zIndex = '99999';
    learnButton.style.padding = '8px 39px';
    learnButton.style.backgroundColor = '#004d4f';
    learnButton.style.color = '#fff';
    learnButton.style.border = 'none';
    learnButton.style.borderRadius = '20px';
    learnButton.style.cursor = 'pointer';
    learnButton.style.fontSize = '18px';
    learnButton.style.fontWeight = 'bold';
    learnButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

    learnButton.addEventListener('click', handleCourse );

    async function listonButton( append ){
        console.log(localeTimeStr() + " listonButton");

        const navbar = document.querySelector(".user_my_nav");
        //console.log(navbar)
        if( append ){
            navbar.appendChild(learnButton);
        }
        else{
            if( navbar.contains( learnButton ) ){
                navbar.removeChild(learnButton);
            }
        }
    }

    async function navbarSwitch( append ){
        console.log(localeTimeStr() + " navbarSwitch");

        if ( append ){
            const doms = document.querySelectorAll('.user_my_nav_li_title');
            const dom = Array.from(doms).find(div => div.textContent.trim() === '正在学习的课程');

            if (dom) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class') {
                            //console.log('目标元素的class属性变更:', dom.className);
                            if( dom.className.includes("user_my_nav_li_title_on") ){
                                listonButton( true );
                            }
                            else{
                                listonButton( false );
                            }
                        }
                    });
                });

                observer.observe(dom, { attributes: true, attributeFilter: ['class'] });
            }
        }
        else{
            listonButton( false );
        }
    }

    async function loadComplete(){

        const url = location.pathname;


        if( url.includes("/detail")){
            console.log( localeTimeStr() + " loadComplete... " + url );

            const params = new URLSearchParams(window.location.search);
            const isauto = params.get('a');

            if( isauto && isauto=="1" ){
                console.log(localeTimeStr() + " loadComplete... auto" );
                await learn_Course();
            }
        }
        else if( url.includes("/person") ){

            console.log(localeTimeStr() + " loadComplete... " + url );

            await waitForElementAppear( '.user_my_nav_li' );
            await sleep( 200 );

            // 等待节点出现
            const doms = document.querySelectorAll('.user_my_nav_li');
            const dom = Array.from(doms).find(div => div.textContent.trim() === '我的课程');

            if (dom) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class') {
                            //console.log('目标元素的class属性变更:', dom.className);
                            if( dom.className.includes("li_on") ){
                                navbarSwitch( true );
                            }
                            else{
                                navbarSwitch( false );
                            }
                        }
                    });
                });

                observer.observe(dom, { attributes: true, attributeFilter: ['class'] });
            }

            console.log( localeTimeStr() + " loadComplete... Done " );
        }
    }

    // 确保图片、样式表等所有资源完全加载后执行
    if (document.readyState === 'complete') {
        loadComplete();
    } else {
        window.addEventListener('load', loadComplete);
    }
})();
