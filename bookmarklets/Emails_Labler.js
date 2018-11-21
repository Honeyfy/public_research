// ==UserScript==
// @name         Emails Labler
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        https://app.gong.io/account?*
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/Emails_Labler.js
// ==/UserScript==

'use strict';

const classes = {
    "Request for meeting": false,
    "Request for rescheduling\postponing": false,
    "Person introduction": false,
    "Request for information about the product by the client": false,
    "Product features information": false,
    "Request for Pricing": false,
    "Pricing info by the seller": false,
    "Support request & technical issues": false,
    "Negotiation/commercial discussion": false,
    "Request to proceed process": false,
    "Answer to Request to proceed process": false,
    "Customer delay": false,
    "Request for an action": false,
    "Answer to Request for an action": false,
    "Request for review": false,
    "Follow-up": false,
    "OOO/get to you later": false,
    "Nudge": false,
    "Objections/concerns": false,
    "Positive buying signal": false,
    "Negative buying signal": false,
    "Other": false,
    "Ball > Seller": false,
    "Ball > Customer": false,
    "Ball @ Seller - confirmation": false,
    "Ball @ Customer - confirmation": false,
};

const labels = {
    "Request for meeting": "a request to meet/discuss at a specific time, in one of several options or offer to set up a meeting in general.",
    "Request for rescheduling\postponing": "a request to delay and existing meeting to a known or unknown time or cancel meeting.",
    "Person introduction": "an addition of a person to the correspondence",
    "Request for information about the product by the client": "",
    "Product features information": "",
    "Request for Pricing": "",
    "Pricing info by the seller": "",
    "Support request & technical issues": "",
    "Negotiation/commercial discussion": "every step beyond the two first steps that include discussion on the price and the feature it includes.",
    "Request to proceed process": "a request to move to the next step in the opportunity, such as request to start the demo, request to start speaking on the price, request to take a decision, to sign, etc.",
    "Answer to Request to proceed process": "",
    "Customer delay": "A request or decision to stop or pause the opportunity process, such as saying that they consider other options, have to get approval from the finance etc.",
    "Request for an action": "A specific request for an action which does not have a specific tagging, for example, a request to open a feature on the platform, a request to get more time for the demo, etc.",
    "Answer to Request for an action": "",
    "Request for review": "A request to give feedback on the tool/platform/process/deal.",
    "Follow-up": "mails written after/in response to a call made just before it.",
    "OOO/get to you later": "non-automatic mails, in which the seller/costumer say that he can’t answer right know (and usually will answer later).",
    "Nudge": "reminder or request to get an answer or do some action.",
    "Objections/concerns": "",
    "Positive buying signal": "Any positive sign that the deal is going towards “closed won”.",
    "Negative buying signal": "Any negative sign that the deal is going towards “closed lost”",
    "Other": "An important interaction that doesn't fall into any of the available tags",
    "Ball > Seller": "The sender moves the ball to the seller.",
    "Ball > Customer": "The sender moves the ball to the customer.",
    "Ball @ Seller - confirmation": "The sender acknowledges a previously known fact that the seller has the ball.",
    "Ball @ Customer - confirmation": "The sender acknowledges a previously known fact that the customer has the ball.",
}

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
    var saveButton = $("<li class='app-nav-item-left'><a href='javascript:save();' class='hidden-xs'><span>SAVE</span></a></li>");
    $(".app-nav-item-left").last().after(saveButton);
}

var prev_email_id = 0;

function init() {

}

function initEmail(email_id){
    var current_email = $(".account-activity-item.expanded")[0];
    email_id = email_id || current_email.id;

    if (email_id === prev_email_id) {
        return;
    }

    $('#labler').remove();
    prev_email_id = email_id;

    var parent = $(".activity-expanded-view-panel-body");
    //var container = $('<div id="labler" class="btn-group-toggle" data-toggle="buttons"></div>');
    var container = $('<div id="labler" style="column-count:2" class="collapsed"></div>');

    var email_data = data[email_id];

    if (!email_data){
        /* init with default values */
        email_data = {};
        email_data.html_class_names = current_email.className;
        email_data.url = document.location.href;
        email_data.labeler = '';
        email_data.current_datetime = '';
        if ($(parent.find('.g-badge')[0]).hasClass('email-direction-inbound')) {
            email_data.email_direction = 'inbound';
        } else if ($(parent.find('.g-badge')[0]).hasClass('email-direction-outbound')) {
            email_data.email_direction = 'outbound';
        } else {
            email_data.email_direction = '';
        }
        // email_data.email_date = $('.day-date-header').text();
        email_data.classes = Object.assign({}, classes);
        data[email_id] = email_data;
    }

    console.log(email_id);
    console.log(email_data.classes);
    $.each(email_data.classes, function(key, value) {
        var chkbox = $('<input type="checkbox" value="'+ key+ '"/>');
        if (value) {
            chkbox.prop('checked', true);
        }
        chkbox.on('click', function(e){
            //fix url in the ugliest way :(
            email_data.url = document.location.href;
            var user_name = $('i.user-attention.on-dark-bg').parent().text().trim();
            var current_datetime = (new Date().toLocaleString()).replace(',', '');
            email_data.labeler = user_name;
            email_data.current_datetime = current_datetime;
            email_data.classes[this.value] = this.checked;
            updateStorage();
        });
        // chkbox.appendTo(container);

        wrapper = $('<div class="labeling-option"></div>');
        wrapper.append(chkbox);
        wrapper.append('<label title="' + labels[key] + '">'+key+'</label>');
        container.append(wrapper);
        // $('<div class="labeling-option">'+chkbox.prop('outerHTML')+'<label>'+key+'</label></div>').appendTo(container);
    });

    parent.prepend(container);

    $('div#labler').hover(
        function(){ $(this).removeClass('collapsed'); },
        function(){ $(this).addClass('collapsed'); }
    );
}

function add_style(css) {
    var head = document.head || document.getElementsByTagName('head')[0], style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet){ style.styleSheet.cssText = css; } else {
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
}


$(document).ready(function(e) {
    add_style("div#labler { background: white; z-index: 2; border: 1px solid #aaa; box-shadow: 0px 0px 15px #777; padding: 5px; column-count: 2; margin: -15px 0px 20px; overflow: hidden; } ");
    add_style("div#labler.collapsed { max-height: 40px; }");

    window.save = function(filename){
        if(!data || Object.keys(data).length === 0) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'export.csv';

        var fields = Object.keys(classes);
        var replacer = function(key, value) { return value === null ? '' : value } ;
        var csv = Object.keys(data).map(function(key){
            var email = data[key];
            var labeler = email.labeler || '';
            var direction = email.direction || '';
            var current_datetime = email.current_datetime || '';
            var email_direction = email.email_direction;
            return key + "," + email.url + "," + labeler + ',' + current_datetime + ',' + email_direction + ',' + email.html_class_names + "," + fields.map(function(fieldName){
                return JSON.stringify(email.classes[fieldName], replacer);
            }).join(',')
        });
        csv.unshift('id,url,user_name, current_datetime, direction, html_class_names,' + fields.join(',')); // add header column
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

    addSaveButton();

    $('.account-activities-panel.activity-expanded-view-panel ').on("DOMSubtreeModified", ".full-height-with-scroll-inner", function(e){
        initEmail();
    });

    $('.account-activities-panel.day-activities-list-panel').on("click", ".activity-type-email", function(e){
        // $('#labler').html('');
        // $('#labler').remove();
        var email_id = $(this)[0].id;
        initEmail(email_id);
    });


    $('.account-activities-panel.activity-expanded-view-panel').on("click", ".labeling-option label", function(e){
        var chkbox = $(this).parent().children('input');
        chkbox.click();
        /*
        chkbox.prop('checked', !chkbox.prop("checked"));
        email_data.classes[chkbox.value] = chkbox.checked;
        updateStorage();
        */
    });

    initEmail();

});
