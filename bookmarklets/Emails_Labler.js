// ==UserScript==
// @name         Emails Labler
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  try to take over the world!
// @author       You
// @match        https://app.gong.io/account?*
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/Emails_Labler.js
// ==/UserScript==

'use strict';

var email_id;

const outbound_labels = {
    "Question" : "Asked",
    "Schedule" : "Date"
};
const inbound_labels = {
    "Answer" : "Answered",
    "No Answer" : "Not answered"
};


var labels;

const entry = "EmailsClassificationData";


var data = localStorage.getItem(entry);
if (data === null){
    data = "{}";
}

data = JSON.parse(data);

function updateStorage(){
    localStorage.setItem(entry, JSON.stringify(data));
}

function addSaveButton(){
    var saveButton = $("<a href='javascript:save();' class='btn btn-link nav-link'><span style='color:blue'>SAVE</span></a>");
    //$(".app-nav-item-left").last().after(saveButton);
    $(".activities-top-nav").last().append(saveButton);
}

function addClearButton(){
    var clearButton = $("<li class='app-nav-item-left'><a href='javascript:clearData();' class='hidden-xs'><span style='color:red'>CLEAR</span></a></li>");
    $(".app-nav-item-left").last().after(clearButton);
}

function addLabels(){
    var data_labels = [];
    if(data[email_id]){
        data_labels = data[email_id].labels;
    }
    var labelContainer = $(`<div id='LabelContainer' class='activities-top-nav' style='display: flex; justify-content: space-between;'><div></div></div>`);
    $(".activities-top-nav").last().after(labelContainer);
    for (const label in labels){
        let checked = data_labels.includes(label);
        var labelItem = $(`<a data-checked='${checked}' data-label-name='${label}' href='javascript:clickLabel("${label}")' class='btn btn-link nav-link'` +
                          `style='margin: 0 10px; border-radius: 3px; box-shadow: 0px 0px 5px 1px #9a9090;'>` +
                          `<span style='color:darkblue'>${label}</span>` +
                          `</a>`);
        labelItem.css("background-color", checked?"yellow":"white");
        labelContainer.children().append(labelItem);

    }
}

function removeLabels(){
    $('#LabelContainer').remove();
}

var prev_url = "";

function init() {

}

function add_style(css) {
    var head = document.head || document.getElementsByTagName('head')[0], style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet){ style.styleSheet.cssText = css; } else {
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
}


function initEmail2(){
    var current_email = $(".account-activity-item.expanded")[0];
    if (current_email){
        email_id = current_email.id;
        var email_data = data[email_id];

        var parent = $(".activity-expanded-view-panel-body");
        if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-inbound')) {
            labels = inbound_labels;
        } else if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-outbound')) {
            labels = outbound_labels;
        }

        if (!email_data){
            email_data = {};
            if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-inbound')) {
                email_data.email_direction = 'inbound';
            } else if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-outbound')) {
                email_data.email_direction = 'outbound';
                labels = outbound_labels;
            } else {
                return;
            }
            email_data.url = document.location.href;
            email_data.text = $(".email-body")[0].innerText;
            email_data.subject = $(".gong-email-title")[0].innerText;
            email_data.labels = [];
            data[email_id] = email_data;

        }
        addLabels();
        addSaveButton();
    }
}

function resetLabels(){
    var label = [];
    if(data[email_id]){
        label = data[email_id].labels;
    }
    let l = $(".activities-top-nav").last().children('div').children();
    for(let i = 0; i < l.length; i++){
        if (label.includes(l[i].dataset.labelName)){
            l[i].style.backgroundColor = "yellow"
            l[i].dataset.checked = "true";
        }
         else{
            l[i].style.backgroundColor = "white";
            l[i].dataset.checked = "false";
        }
    }
}

$(document).ready(function(e) {
    var interval = setInterval(()=>{
        if($(".account-activities-panel.day-activities-list-panel").length > 0 && $(".email-body").length > 0){
            add_style("div#labler { background: white; z-index: 2; border: 1px solid #aaa; box-shadow: 0px 0px 15px #777; padding: 5px; column-count: 2; margin: -15px 0px 20px; overflow: hidden; } ");
            add_style("div#labler.collapsed { max-height: 40px; }");

            window.save = function(filename){
                updateStorage();
                if(!data || Object.keys(data).length === 0) {
                    console.error('No data')
                    return;
                }

                if(!filename) filename = 'export.csv';

                var csv = Object.keys(data).map(function(key){
                    var email = data[key];
                    // check if at least one is not false
                    if (!Object.values(email.labels).some(x=>x))
                    {
                        return;
                    }
                    var labels = email.labels.join(',') || '';
                    var direction = email.direction || '';
                    var current_datetime = email.current_datetime || '';
                    var subject = email.subject || '';
                    var text = email.text || '';

                    var email_direction = email.email_direction;
                    return key + "," + email.url + ',' + email_direction + ',"' + labels + '","' + subject + '","' + text + '"';
                });

                csv.unshift('id,url,direction,labels,subject,text');
                csv = csv.filter(function (el) {
                    if(el)
                        return el;
                    return false;
                });
                var allText = csv.join('\r\n');


                var blob = new Blob([allText], {type: 'text/json'});
                var e = document.createEvent('MouseEvents');
                var a = document.createElement('a');

                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            }

            window.clickLabel = (label) =>{
                let l = $(".activities-top-nav").find(`[data-label-name='${label}']`);

                if (l[0].dataset.checked == "false"){
                    data[email_id].labels.push(label);
                    l.css("background-color", "yellow");
                    l[0].dataset.checked = "true";
                }
                else{
                    const index = data[email_id].labels.indexOf(label);
                    if (index > -1) {
                        data[email_id].labels.splice(index, 1);
                    }
                    l.css("background-color", "white");
                    l[0].dataset.checked = "false";
                }
            };



            clearInterval(interval);
        }
    }, 600);


    window.setInterval(function(){
        current_url = document.location.href;
        if (current_url === prev_url || $('.activities-top-nav').length == 1){
            return;
        }
        removeLabels();
        if ($(".email-body").length > 0){
            updateStorage();
            prev_url = current_url;
            initEmail2();
        }
    }, 600);
});
