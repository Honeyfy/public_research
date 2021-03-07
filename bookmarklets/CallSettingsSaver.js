// ==UserScript==
// @name         Call Settings Saver
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Refresh is not scary anymore!
// @author       Golan Levy
// @match        https://app.gong.io/call*
// @grant        none
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/CallSettingsSaver.js

// ==/UserScript==

(function() {
    'use strict';
    var fields = ['currentTime','playbackRate'];
    var url = new URL(window.location);
    var callId = url.searchParams.get("id");
    var dataKey = "callSettings-" + callId;

    $(document).ready(function(e) {
        var video = document.getElementById('callRecordingVideo');

        var callSettings = JSON.parse(localStorage.getItem(dataKey));
        if (callSettings !== null){
            setCallSettings(video, callSettings);
        }

        setInterval(function(){
            localStorage.setItem(dataKey, extractCallSettings(video));
        }, 3000);
    });

    function extractCallSettings(video){
        var settings = {};
        for (const f of fields) {
            settings[f] = video[f];
        }
        return JSON.stringify(settings);
    }

    function setCallSettings(video, settings){
        for (const f of fields) {
            video[f] = settings[f];
        }
    }

})();
