document.addEventListener('DOMContentLoaded', () => {
    /* 当前页的CID */
    const cid = $('.joe_detail').attr('data-cid');

    /* 获取本篇文章百度收录情况 */
    {
        $.ajax({
            url: Joe.BASE_API,
            type: 'POST',
            data: { routeType: 'baidu_record', site: window.location.href },
            success(res) {
                if (res.data && res.data === '已收录') {
                    $('#Joe_Baidu_Record').css('color', '#67C23A');
                    $('#Joe_Baidu_Record').html('已收录');
                } else {
                    /* 如果填写了Token，则自动推送给百度 */
                    if (Joe.BAIDU_PUSH) {
                        $('#Joe_Baidu_Record').html('<span style="color: #E6A23C">未收录，推送中...</span>');
                        const _timer = setTimeout(function () {
                            $.ajax({
                                url: Joe.BASE_API,
                                type: 'POST',
                                data: {
                                    routeType: 'baidu_push',
                                    domain: encodeURI(window.location.hostname),
                                    url: encodeURI(window.location.href)
                                },
                                success(res) {
                                    if (res.error) {
                                        $('#Joe_Baidu_Record').html('<span style="color: #F56C6C">推送失败，请检查！</span>');
                                    } else {
                                        $('#Joe_Baidu_Record').html('<span style="color: #67C23A">推送成功！</span>');
                                    }
                                }
                            });
                            clearTimeout(_timer);
                        }, 1000);
                    } else {
                        const url = `https://ziyuan.baidu.com/linksubmit/url?sitename=${encodeURI(window.location.href)}`;
                        $('#Joe_Baidu_Record').html(`<a target="_blank" href="${url}" rel="noopener noreferrer nofollow" style="color: #F56C6C">未收录，提交收录</a>`);
                    }
                }
            }
        });
    }

    /* 激活代码高亮 */
    {
        Prism.highlightAll();
        $("pre[class*='language-']").each(function (index, item) {
            let text = $(item).find("code[class*='language-']").text();
            let span = $(`<span class="copy"><i class="fa fa-clone"></i></span>`);
            new ClipboardJS(span[0], { text: () => text }).on('success', () => Qmsg.success('复制成功！'));
            $(item).append(span);
        });
    }

    /* 激活复制功能 */
    {
        new ClipboardJS('.joe_detail__article-copy').on('success', () => Qmsg.success('复制成功！'));
    }

    /* 激活图片预览功能 */
    {
        $('.joe_detail__article img:not(img.owo_image)').each(function () {
            $(this).wrap($(`<span data-fancybox="Joe" href="${$(this).attr('src')}"></span>`));
        });
    }

    /* 设置文章内的链接为新窗口打开 */
    {
        $('.joe_detail__article a:not(.joe_detail__article-anote)').each(function () {
            $(this).attr({ target: '_blank', rel: 'noopener noreferrer nofollow' });
        });
    }

    /* 激活浏览功能 */
    {
        let viewsArr = localStorage.getItem(Joe.encryption('views')) ? JSON.parse(Joe.decrypt(localStorage.getItem(Joe.encryption('views')))) : [];
        const flag = viewsArr.includes(cid);
        if (!flag) {
            $.ajax({
                url: Joe.BASE_API,
                type: 'POST',
                data: { routeType: 'handle_views', cid },
                success(res) {
                    if (res.code !== 1) return;
                    $('#Joe_Article_Views').html(`${res.data.views} 阅读`);
                    viewsArr.push(cid);
                    const name = Joe.encryption('views');
                    const val = Joe.encryption(JSON.stringify(viewsArr));
                    localStorage.setItem(name, val);
                }
            });
        }
    }

    /* 激活文章点赞功能 */
    {
        let agreeArr = localStorage.getItem(Joe.encryption('agree')) ? JSON.parse(Joe.decrypt(localStorage.getItem(Joe.encryption('agree')))) : [];
        if (agreeArr.includes(cid)) $('.joe_detail__agree .icon-1').addClass('active');
        else $('.joe_detail__agree .icon-2').addClass('active');
        let _loading = false;
        $('.joe_detail__agree .icon').on('click', function () {
            if (_loading) return;
            _loading = true;
            agreeArr = localStorage.getItem(Joe.encryption('agree')) ? JSON.parse(Joe.decrypt(localStorage.getItem(Joe.encryption('agree')))) : [];
            let flag = agreeArr.includes(cid);
            $.ajax({
                url: Joe.BASE_API,
                type: 'POST',
                data: { routeType: 'handle_agree', cid, type: flag ? 'disagree' : 'agree' },
                success(res) {
                    if (res.code !== 1) return;
                    $('.joe_detail__agree .text').html(res.data.agree);
                    if (flag) {
                        const index = agreeArr.findIndex(_ => _ === cid);
                        agreeArr.splice(index, 1);
                        $('.joe_detail__agree .icon-1').removeClass('active');
                        $('.joe_detail__agree .icon-2').addClass('active');
                        $('.joe_detail__agree .icon').removeClass('active');
                    } else {
                        agreeArr.push(cid);
                        $('.joe_detail__agree .icon-2').removeClass('active');
                        $('.joe_detail__agree .icon-1').addClass('active');
                        $('.joe_detail__agree .icon').addClass('active');
                    }
                    const name = Joe.encryption('agree');
                    const val = Joe.encryption(JSON.stringify(agreeArr));
                    localStorage.setItem(name, val);
                },
                complete() {
                    _loading = false;
                }
            });
        });
    }

    /* 格式化分页的hash值 */
    {
        $('.joe_comment .joe_pagination a').each((index, item) => {
            const href = $(item).attr('href');
            if (href && href.includes('#')) {
                $(item).attr('href', href.replace('#comments', '?scroll=joe_comment'));
            }
        });
    }

    /* 密码保护文章，输入密码访问 */
    {
        $('.joe_detail__article-protected').on('submit', function (e) {});
    }
});

/* 写在load事件里，为了解决图片未加载完成，滚动距离获取会不准确的问题 */
window.addEventListener('load', function () {
    /* 激活点击回复可见的回复按钮，页面滚动到评论区 */
    {
        $('.joe_detail__article-hide i').on('click', function () {
            const top = $('.joe_comment').offset().top - $('.joe_header').height() - 15;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    }
    /* 判断地址栏是否有锚点链接，有则跳转到对应位置 */
    {
        const scroll = new URLSearchParams(location.search).get('scroll');
        if (scroll) {
            const height = $('.joe_header').height();
            let elementEL = null;
            if ($('#' + scroll).length > 0) {
                elementEL = $('#' + scroll);
            } else {
                elementEL = $('.' + scroll);
            }
            if (elementEL && elementEL.length > 0) {
                const top = elementEL.offset().top - height - 15;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    }
});
