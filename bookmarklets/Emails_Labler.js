// ==UserScript==
// @name         Emails Labler
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the world!
// @author       You
// @match        https://app.gong.io/account?*
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/Emails_Labler.js
// ==/UserScript==

'use strict';

const mutual = {
    "NO LABEL": false,
    "Request for meeting": false,
    "Request to reschedule or postpone": false,
    "Follow-up": false,
    "Person introduction": false,
    "Negotiation/commercial discussion": false,
    "OOO/get to you later": false,
    "Other": false,
    "Ball > Seller": false,
    "Ball > Customer": false,
    "Ball @ Seller - confirmation": false,
    "Ball @ Customer - confirmation": false,
    "Request for some action": false
};


const customer_classes = Object.assign({}, mutual,{
    "Request for pricing": false,
    "Request for information on the product": false,
    "Request for technical help": false,
    "Delay of process": false,
    "Positive buying signal": false,
    "Negative buying signal": false
});

const seller_classes = Object.assign({}, mutual,{
    "Price offer": false,
    "Details on the product" :false,
    "Request to proceed process": false,
    "Nudge": false
});

const all_classes = Object.assign({}, customer_classes, seller_classes);


const labels = {
    "NO LABEL": "A way to differentiate between (1) deciding that none of the labels fit and (2) clicking the email for a different purpose than labeling it.",
    "Request for meeting": "A request to meet/discuss at a specific time, or an offer to set up a meeting in future without specific time.",
    "Request to reschedule or postpone": "A request to delay an existing meeting to a known or unknown time or cancel a meeting.",
    "Person introduction": "An addition of a person to the correspondence.",
    "Follow-up": "Emails written following a call/meeting, following up with a summary of the discussion and/or next steps.",
    "Request for pricing": "A request for general pricing or specific pricing. Note that this does not include negotiating the terms (e.g. asking for a discount). It does include request for pricing for a slightly modified package.",
    "Price offer":"Information on the price given by the seller.",
    "Negotiation/commercial discussion": "Every discussion that include negotiation on the price of the product and the conditions of the deal, and isn’t an explicit price request or an explicit price offer.",
    "Request for information on the product": "Request for general information on the product/platform through or specific questions which is not technical.",
    "Request for technical help":"Specific technical issues and requests. It is hard to distinguish between them and I would have merge them.",
    "Details on the product": "Details on the product, both general and technical given by the sellers.",
    "Request to proceed process": "A request to move to the next step in an opportunity. For example, a request to start the pilot, a request to start commercial discussion on price etc., a request to reach a decision, to sign the contract etc.",
    "Delay of process": " A request or decision to stop or pause the opportunity process. Causes can be, for example, that they consider other options, have to get approval from finance etc.",
    "Request for some action" : "A specific request for an action to be done which does not have a specific tagging in our platform. Usually it a request which is not solely providing information. For example, a request to open a feature on the platform, a request to extend a pilot, a request to ask a colleague something, a request to send a screenshot etc.",
    "OOO/get to you later": "Mails sent manually (non-automatically), in which either party states that he isn't currently available.",
    "Nudge": "A reminder or request to get an answer or do some action.",
    "Positive buying signal": "Any positive sign that the deal is going well and will likely close as “won”.",
    "Negative buying signal": "Any negative sign that the deal is not going well and will likely close as “lost”. This includes concerns and objections.",
    "Other": "Any other subject which seems to be important but do not have a unique tag for it. Or problematic mails which it is difficult to define what tags it should get.",
    "Ball > Seller": "The ball moves from the customer to the seller.",
    "Ball > Customer": "The ball moves from the seller to the customer.",
    "Ball @ Seller - confirmation": "A mail in which the sender confirms that the seller has the ball.",
    "Ball @ Customer - confirmation": "A mail in which the sender confirms that the customer has the ball."
};

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

var prev_url = "";

function init() {

}

function initEmail(){
    var current_email = $(".account-activity-item.expanded")[0];
    email_id = current_email.id;

    $('#labler').remove();

    var parent = $(".activity-expanded-view-panel-body");
    //var container = $('<div id="labler" class="btn-group-toggle" data-toggle="buttons"></div>');
    var container = $('<div id="labler" style="column-count:2" class="collapsed"></div>');

    var email_data = data[email_id];

    if (!email_data){
        /* init with default values */
        email_data = {};

        if ($(parent.find('.g-badge')[0]).hasClass('email-direction-inbound')) {
            email_data.email_direction = 'inbound';
            email_data.classes = Object.assign({}, customer_classes);
        } else if ($(parent.find('.g-badge')[0]).hasClass('email-direction-outbound')) {
            email_data.classes = Object.assign({}, seller_classes);
            email_data.email_direction = 'outbound';
        } else {
            return;
        }

        email_data.html_class_names = current_email.className;
        email_data.url = document.location.href;
        email_data.labeler = '';
        email_data.current_datetime = '';
        
        // email_data.email_date = $('.day-date-header').text();
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

        var fields = Object.keys(all_classes).filter(x=> x !== "NO LABEL");
        var replacer = function(key, value) { return value === null ? '' : value } ;
        var csv = Object.keys(data).map(function(key){
            var email = data[key];
            // check if atleast one is not false
            if (!Object.values(email.classes).some(x=>x))
            {
                return undefined;
            }
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


    $('.account-activities-panel.activity-expanded-view-panel').on("click", ".labeling-option label", function(e){
        var chkbox = $(this).parent().children('input');
        chkbox.click();
        /*
        chkbox.prop('checked', !chkbox.prop("checked"));
        email_data.classes[chkbox.value] = chkbox.checked;
        updateStorage();
        */
    });

    window.setInterval(function(){
        current_url = document.location.href;
        if (current_url === prev_url){
            return;
        }

        prev_url = current_url;
        initEmail();
    }, 300);
});
