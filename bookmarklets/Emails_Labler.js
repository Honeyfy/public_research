// ==UserScript==
// @name         Emails Labler
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  try to take over the world!
// @author       You
// @match        https://app.gong.io/account?*
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// @require https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/Emails_Labler.js
// ==/UserScript==

'use strict';

var email_id;
var direction;
var outbound_labels, inbound_labels, labels;
var in_database = false;
var data = {};
var i = 0;
var prev_url = "";

function addCss(cssString) {
    var head = document.getElementsByTagName('head')[0];
    var newCss = document.createElement('style');
    newCss.type = "text/css";
    newCss.innerHTML = cssString;
    head.appendChild(newCss);
}

async function getLabels(name){
    let url = `https://email-labeling-default-rtdb.firebaseio.com/${name}.json`;
    return fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response)=> response.json()).then((response_data)=>{
        return response_data;
    });

}

async function setLabels(name, labels){
    let url = `https://email-labeling-default-rtdb.firebaseio.com/${name}.json`;
    fetch(url, {
            method: 'PUT', // *GET, POST, PUT, DELETE, etc.
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(labels)
        })

}

function deleteFromStorage(){
    let url = `https://email-labeling-default-rtdb.firebaseio.com/${email_id}.json`;
    fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-type': 'application/json; charset=UTF-8' // Indicates the content
        },
    })
}

function updateStorage(){
    if (data && data[email_id] && data[email_id].labels.length > 0){
        let url = `https://email-labeling-default-rtdb.firebaseio.com/${email_id}.json`;
        fetch(url, {
            method: 'PATCH', // *GET, POST, PUT, DELETE, etc.
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data[email_id])
        })
    }
    else if(in_database && data && data[email_id]){
        deleteFromStorage();
    }
}

function addButtons(){
    var buttons = $("<div style='display: flex; justify-content: flex-end; margin: 0; padding: 0;'><a href='javascript:editLabels();' class='btn btn-link nav-link'><span style='color:darkgreen'>EDIT</span></a>"+
                    "<a href='javascript:save();' class='btn btn-link nav-link'><span style='color:blue'>SAVE</span></a>"+
                    "<a href='javascript:clearData();' class='btn btn-link nav-link'><span style='color:darkred'>CLEAR</span></a></div>");
    $(".activities-top-nav").last().prepend(buttons);
}

function addLabels(){
    $(".activities-top-nav").last().css("padding-bottom", "0")
    var data_labels = [];
    if(data[email_id]){
        data_labels = data[email_id].labels;
    }
    var labelContainer = $(`<div id='LabelContainer' class='activities-top-nav' style='display: flex; flex-direction: column; padding-top: 0;'><div></div></div>`);
    $(".activities-top-nav").last().after(labelContainer);
    for (const label in labels){
        let checked = data_labels.includes(label);
        var labelItem = $(`<a data-checked='${checked}' data-label-name='${label}' href='javascript:clickLabel("${label}")' class='btn btn-link nav-link label-container'>` +
                          `<span style='color:darkblue'>${label}</span>` +
                          `</a>`);
        labelItem.css("background-color", checked?"yellow":"white");
        labelContainer.children().append(labelItem);

    }
}

function removeLabels(){
    $('#LabelContainer').remove();
}


function add_style(css) {
    var head = document.head || document.getElementsByTagName('head')[0], style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet){ style.styleSheet.cssText = css; } else {
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
}

function initEmail(){
    updateStorage();
    var current_email = $(".account-activity-item.expanded")[0];
    if (current_email){
        email_id = current_email.id;

        let url = `https://email-labeling-default-rtdb.firebaseio.com/${email_id}.json`;
        fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response)=> response.json()).then((response_data)=>{
            var email_data = response_data;

            var parent = $(".activity-expanded-view-panel-body");
            if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-inbound')) {
                direction = "inbound";
                labels = inbound_labels;
            } else if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-outbound')) {
                direction = "outbound";
                labels = outbound_labels;
            }

            if (!email_data){
                in_database = false;
                email_data = {};
                if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-inbound')) {
                    email_data.email_direction = 'inbound';
                } else if ($(parent.find('.email-activity-preview__icon')[0]).hasClass('email-direction-outbound')) {
                    email_data.email_direction = 'outbound';
                } else {
                    return;
                }
                email_data.url = document.location.href;
                //email_data.text = $(".email-body")[0].innerText;
                //email_data.subject = $(".gong-email-title")[0].innerText;
                email_data.labels = [];
                data[email_id] = email_data;

            }
            else{
                in_database = true;
                data[email_id] = email_data;
            }
            addLabels();
            addButtons();
        });
    }
}

function resetLabels(){
    let l = $(".activities-top-nav").last().children('div').children();
    for(let i = 0; i < l.length; i++){
        l[i].style.backgroundColor = "white";
        l[i].dataset.checked = "false";
    }
}

function createModal(){
    let uiLabels = "<div id='dialog' title='Edit Labels'>"

    for (const label in labels){
        uiLabels += `<div class="dialog-row" data-label-edit="edit-label-${i}"><span contenteditable="true">${label}</span><a href="javascript:removeLabel(${i})" class="remove-button">x</a></div>`;
        i++;
    }

    uiLabels += `<div><a href="javascript:addLabel()" class="add-button">+</a></div>`
    uiLabels += "</div>"

    $(uiLabels).dialog({
        closeText: "x",
        close: function( event, ui ) {
            $( this ).dialog( "destroy" );
        },
        buttons: [
            {
                text: "Done",
                class: "ui-dialog-button-done",
                click: function() {
                    saveNewLabels();
                    console.log(labels);
                    setLabels(direction + "_labels", labels);
                    $( this ).dialog( "destroy" );
                }
            }
        ]
    });


}


async function onLoad(){
    outbound_labels = await getLabels("outbound_labels");
    inbound_labels = await getLabels("inbound_labels");


    var interval = setInterval(()=>{
        if($(".account-activities-panel.day-activities-list-panel").length > 0 && $(".email-body").length > 0){
            add_style("div#labler { z-index: 2; border: 1px solid #aaa; box-shadow: 0px 0px 15px #777; padding: 5px; column-count: 2; margin: -15px 0px 20px; overflow: hidden; } ");
            add_style("div#labler.collapsed { max-height: 40px; }");

            window.save = function(filename){
                updateStorage();
            }

            window.editLabels = function(){
                createModal();

            }

            window.clearData = function(){
                resetLabels();
                delete data[email_id];
                deleteFromStorage();
            }

            window.saveNewLabels = () =>{
                let newLabels = {};
                let l = $("#dialog").find("span");
                for (let i = 0; i < l.length; i++){
                    newLabels[$(l[i]).text()] = "";
                }
                labels = newLabels;
                if (direction === "outbound"){
                    outbound_labels = newLabels;
                }
                else if (direction === "inbound"){
                    inbound_labels = newLabels;
                }
                removeLabels();
                initEmail();
            }

            window.removeLabel = (index) =>{
                $("div").find(`[data-label-edit='edit-label-${index}']`).remove();
            }

            window.addLabel = function() {
                $("#dialog").children().last().before(`<div class="dialog-row" data-label-edit="edit-label-${i}"><span contenteditable="true">New Label</span><a href="javascript:removeLabel(${i})" class="remove-button">x</a></div>`)
                i++;
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
            prev_url = current_url;
            initEmail();
        }
        else if ($(".call-activity-preview").length > 0){
            prev_url = current_url;
        }
    }, 600);
};

$(document).ready(onLoad());

addCss('.ui-dialog { position: absolute; width: 300px; overflow: hidden; background-color: white; box-shadow: #b1adad 0 0 10px 4px; border-radius: 3px;}\n'+
       '.ui-dialog:focus { outline: none !important; }\n'+
       '.ui-dialog .ui-dialog-titlebar { padding: 10px 0; margin: 5px 10px; border-bottom: 1px solid lightgray; position: relative; display: flex; justify-content: space-between; align-items: center; font-size: larger; }\n'+
       '.ui-dialog .ui-dialog-title {  }\n'+
       '.ui-dialog .ui-dialog-content { position: relative; border: 0; margin: .5em 1em; background: none; overflow: auto; zoom: 1; border-bottom: 1px solid lightgray; }\n'+
       '.ui-dialog .dialog-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }\n'+
       '.label-container { margin: 0 5px 10px; border-radius: 3px; box-shadow: 0px 0px 5px 1px #9a9090; }\n'+
       '.ui-dialog .add-button { border: transparent; font-size: larger; font-weight: bolder; color:#118a11; background: transparent; padding: 0; margin: 1px 13px; outline: none !important; }\n'+
       '.ui-dialog .remove-button { border: transparent; font-weight: bolder; color:#a51212; background: transparent; padding: 0; margin: 5px 13px; outline: none !important; }\n'+
       '.ui-dialog .ui-dialog-buttonset .ui-button{ display: flex; flex-direction: column; }\n'+
       '.ui-dialog .ui-dialog-titlebar-close { border-radius:50%; border: transparent; font-weight: bolder; color: gray; background: transparent; outline: none !important; }\n'+
       '.ui-dialog .ui-dialog-titlebar-close:hover { background: #F5EBFC; color: #812AC1; }\n'+
       '.ui-dialog .ui-dialog-buttonpane { display: flex; justify-content: flex-end; margin: 10px; }\n'+
       '.ui-dialog .ui-dialog-button-done { color: #84729B; border: transparent; background: transparent; outline: none !important; }\n'+
       '.ui-dialog .ui-dialog-button-done { color: #480976; }\n'+

       '.ui-draggable .ui-dialog-titlebar { cursor: move; }');
