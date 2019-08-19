// ==UserScript==
// @name         Subtitiles
// @namespace    http://tampermonkey.net/
// @version      0.2.4
// @description  subtitles for a Gong call
// @author       Golan Levy
// @match        https://app.gong.io/call*?id=*
// @grant        none
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/subtitles.js
// ==/UserScript==


(function () {
    'use strict';
    var iframe;


    function ts2num(ts) {
        var num = ts.trimEnd().split(':').reduce((acc, time) => (60 * acc) + +time);
        return num;
    }

    function find_closest_transcript_time(c) {
        var lookfor = ts2num(c);
        var selector = iframe.contents().find('.timestamp');
        var i = 0;

        if (selector.length == 0) { return 0 }      // prevent no transcript error
        try {
            while (lookfor > ts2num(selector[i].innerText) && i < selector.length) {
                i++;
            }
        } catch (e) {
            console.error('An unexpected error has occured', e)
        }
        return selector[i - 1];
    }

    var last_elem = 0;
    /* Scroll transcript page to specific time */
    function scroll_to_time(c) {
        // find_closest_transcript_time(c).scrollIntoView();
        var elem = find_closest_transcript_time(c);
        if (last_elem !== elem) {
            last_elem = elem;
            iframe.contents()[0].documentElement.scrollTop = elem.offsetParent.offsetTop - 50;
        }
    }

    var sibling = $('.player-controls-wrap');

    var callID = window.location.search.split("id=")[1]
    var src = window.location.origin + "/call/pretty-transcript?call-id= " + callID;

    try {
        iframe = $('<iframe id="id0321" height="300px" width="100%"></iframe>');
        iframe.attr('src', src);
        iframe.load(function () {
            iframe.contents().find('body').css("max-width", "98%")
            iframe.contents().find('body').css("padding", "10px 1em 10px 1em")
            iframe.contents().find('.speaker').css("margin-bottom", "0.4em")
            iframe.contents().find('.speaker').css("margin-top", "1em")
            iframe.contents().find('.timestamp').css("top", "-2em")
            iframe.contents().find('.timestamp').css("left", "-2.5em")
            iframe.contents().find('a[class="timestamp"]').each(function (index, item) {
                var right_time = ts2num($(item).text().replace(/\s/g, ""))
                $(item).removeAttr('target')
                $(item).removeAttr('href')
                $(item).click(function() {
                    parent.document.dispatchEvent(new CustomEvent('gong-video-set-current-time', { detail: { time: `${right_time}` , playerId: 'callRecordingVideo'}}));
                    return false;
                })
            })
        })
        sibling.after(iframe);

        $('.video-player-current-time').on('DOMSubtreeModified', function () {
            scroll_to_time($(this).text());
        });
    } catch (e) {
        console.error('An unexpected error has occured', e)
    }
})();
