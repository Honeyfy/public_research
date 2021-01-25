// ==UserScript==
// @name         Smart Speed
// @namespace    http://gong.io/
// @version      0.2.5
// @description  World domination
// @author       Rotem Eilaty
// @match        https://app.gong.io/call?id=*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js

// ==/UserScript==


(function() {
    var monologue_speed = [];
    var silences = [];
    var irrelevent_topics = [];

    var speakers = {};

    var call_id;

    //volume play
    var volumes;
    var volume_max = .5;


    var chosen_options = [false, false, false, false, false]
    var is_smart = 0;
    var is_smart_speed = 1;
    var is_reduce_silence = 2;
    var is_skip_topics = 3;
    var is_smart_volume = 4;

    var smart_duration = 0;

    var segment_duration = 3 * 60;

    var duration = 0;
    var video;

    var seg_count;

    var current_smart_speed = 185;
    var call_wa_mean_smart_speed = 0;
    var smart_speed_diff = current_smart_speed * .25;

    var current_speed = 1;

    var max_smart_speed = 0;
    var min_smart_speed = 0;

    var reduces_seconds_under = 2;
    var break_within_monologue = 1;


    var total = 0;
    var segments = 1;

    function time(amount_of_seconds){
        let hours = Math.floor(amount_of_seconds / 3600);

        let minutes = Math.floor((amount_of_seconds - (hours * 3600)) / 60);
        minutes = (minutes < 10) ? "0" + minutes.toString() : minutes.toString();

        let seconds = Math.floor(amount_of_seconds) % 60;
        seconds = (seconds < 10) ? "0" + seconds.toString() : seconds.toString();

        if (hours > 0){
            hours = (hours < 10) ? "0" + hours.toString() : hours.toString();
            return (hours+":"+minutes+":"+seconds);
        }
        else{
            return (minutes+":"+seconds);
        }
    }

    function create_smart_duration(){
        smart_duration = duration;
        // console.log(current_smart_speed)
        if (chosen_options[is_smart]){
            let start = 0, end = 1, words = 2, speaker = 3, speaker_speed = 2, len = monologue_speed.length, rate = (current_smart_speed / call_wa_mean_smart_speed).toFixed(2);
            if(chosen_options[is_smart_speed]){
                smart_duration = monologue_speed[0][start] * rate;
                for(let i = 0; i < len; i++)
                {
                    let time = monologue_speed[i][end] - monologue_speed[i][start]
                    let speaker_segment = Math.floor(monologue_speed[i][start] / segment_duration);
                    if (speaker_segment < seg_count){
                        smart_duration += time * (speakers[monologue_speed[i][speaker]][segments][speaker_segment][speaker_speed] / current_smart_speed);
                    }
                    else{
                        if (monologue_speed[i][speaker] in speakers && speakers[monologue_speed[i][speaker]].length > segments)
                            smart_duration += time * (speakers[monologue_speed[i][speaker]][segments][speaker_segment - 1][speaker_speed] / current_smart_speed);
                    }
                    if(i < len - 1){
                        let gap = monologue_speed[i + 1][start] - monologue_speed[i][end];
                        smart_duration += gap / rate;
                    }
                }
                smart_duration += (duration - monologue_speed[len - 1][end]) / rate;

            }
            else{
                smart_duration = duration / current_speed;
            }
            if(chosen_options[is_reduce_silence]){
                for(let i = 0; i < silences.length; i++){
                    if(chosen_options[is_smart_speed]){
                        smart_duration -= (silences[i][1] - silences[i][0]) / rate;
                    }
                    else{
                        smart_duration -= (silences[i][1] - silences[i][0]) / current_speed;
                    }
                }

            }
            if(chosen_options[is_skip_topics]){
                // console.log(irrelevent_topics)
                for(let i = 0; i < irrelevent_topics.length; i++){
                    var reduce_time = 0;
                    for(let j = 0; j < len; j++){
                        if(monologue_speed[j][start] >= irrelevent_topics[i][start] && monologue_speed[j][end] < irrelevent_topics[i][end]){
                            let time = monologue_speed[j][end] - monologue_speed[j][start]
                            let speaker_segment = Math.floor(monologue_speed[j][start] / segment_duration);
                            if(chosen_options[is_smart_speed]){
                                reduce_time += time * (speakers[monologue_speed[i][speaker]][segments][speaker_segment][speaker_speed] / current_smart_speed);
                            }
                            else{
                                reduce_time += time / current_speed;
                            }
                        }
                    }
                    smart_duration -= reduce_time;
                }
            }
        }
    }

    function event_smart_speed(j){
        //if (j.length > 5){
        //    console.log(current_smart_speed);
        //    console.log(j[0]);
        //    console.log(speakers[j[0][3]]);
        //}

        video.addEventListener("timeupdate", function() {
            if (chosen_options[is_smart] && chosen_options[is_smart_speed]){
                for (var i = 0; i < j.length; i++){
                    if (j[i].length == 4){
                        if (video.currentTime >= j[i][0] && video.currentTime < j[i][1]){
                            if (duration > segment_duration * 2){
                                for (let i = 0; i < seg_count; i++){
                                    if(video.currentTime <= segment_duration * (i + 1)){
                                        //console.log(j[i]);
                                        //console.log(speakers[j[i][3]]);
                                        //console.log(segments);
                                        //console.log(current_smart_speed / speakers[j[i][3]][segments][i][2])
                                        video.playbackRate = current_smart_speed / speakers[j[i][3]][segments][i][2];
                                        return;
                                    }
                                }
                            }
                            video.playbackRate = current_smart_speed / speakers[j[i][3]][total][2];
                            return;
                        }
                    }
                }
                video.playbackRate = (current_smart_speed / call_wa_mean_smart_speed).toFixed(2);
            }
        }, true);
    }
    async function event_reduce_silence(j){
        video.addEventListener("timeupdate", function() {
            if (chosen_options[is_smart] && chosen_options[is_reduce_silence]){
                for (var i = 0; i < j.length; i++){
                    if (j[i].length == 2){
                        if (video.currentTime >= j[i][0] + reduces_seconds_under/2 && video.currentTime < j[i][1] - reduces_seconds_under/2){
                            video.currentTime = j[i][1] - reduces_seconds_under/2;
                            break;
                        }
                    }
                }
            }
        }, true);
    }
    async function event_skip_irrelevent_topics(j){
        video.addEventListener("timeupdate", function() {
            //console.log("check")
            if (chosen_options[is_smart] && chosen_options[is_skip_topics]){
                for (var i = 0; i < j.length; i++){
                    if (j[i].length == 2){
                        if (video.currentTime >= j[i][0] && video.currentTime < j[i][1]){
                            video.currentTime = j[i][1];
                            break;
                        }
                    }
                }
            }
        }, true);
    }
    async function event_smart_volume(){
        video.addEventListener("timeupdate", function() {
            if (chosen_options[is_smart] && chosen_options[is_smart_volume]){
                for (var i = 0; i < volumes.length; i++){
                    if (video.currentTime >= i && video.currentTime < (i + 1)){
                        let x = volumes[i]!=0 ? (volume_max / volumes[i]) : 1;
                        video.volume = Math.min(x, 1);
                        return;
                    }
                }
            }
        });
    }

    function get_video(){
        let video = document.querySelector('video');
        if (!video){
            video = document.querySelector('audio');
        }
        return video;
    }

    async function create_speed(url){
        var d;
        $.getJSON(url, function(data) {
            monologue_speed = [];

            //duration = data.monologues[data.monologues.length - 1].terms[data.monologues[data.monologues.length - 1].terms.length - 1].end;
            duration = video.duration;

            seg_count = (duration / segment_duration).toFixed(0);
            var index = 0;

            if(data.monologues[0].terms[0].text=="(UNSUPPORTED_LANGUAGE)"){
                d = data;
            }
            else{
                for (var i = 0; i < data.monologues.length; i++){
                    let monologue = data.monologues[i].terms;
                    let count = 0;
                    let end_of_previous_word = monologue[0].start;

                    let pause_in_monologue = [];
                    let pause_start = monologue[0].start;
                    let pause_index = 0;

                    let speaker;
                    try {
                        speaker = data.monologues[i].speaker.id;
                    }
                    catch(err){
                        break;
                    }
                    monologue.forEach((item)=>{
                        if (item.type == "WORD")
                        {
                            count+=1;
                            if (end_of_previous_word + break_within_monologue < item.start){
                                pause_in_monologue[pause_index] = [pause_start, end_of_previous_word, count, speaker]
                                pause_index++;
                                count = 0;
                                pause_start = item.start;
                            }
                            end_of_previous_word = item.end;
                        }
                    })

                    if (pause_index == 0){
                        let start = monologue[0].start;
                        let end = monologue[monologue.length - 1].end;

                        monologue_speed[index] = [start, end, count, speaker]

                        if (speakers[speaker]){
                            speakers[speaker][total][0] += end - start;
                            speakers[speaker][total][1] += count;
                            if(true){ //(duration > segment_duration * 2){
                                for (let i = 0; i < seg_count; i++){
                                    if(end <= segment_duration * (i + 1)){
                                        speakers[speaker][segments][i][0] += end - start;
                                        speakers[speaker][segments][i][1] += count;
                                        speakers[speaker][segments][i][3] = end;
                                        break;
                                    }
                                }
                            }
                        }
                        else{
                            speakers[speaker] = new Array(2);

                            speakers[speaker][total] = [end - start, count];

                            if(true){ //(duration > segment_duration * 2){

                                speakers[speaker][segments] = new Array(seg_count);

                                for (let i = seg_count - 1; i >= 0; i--){
                                    speakers[speaker][segments][i] = [0, 0];
                                    if(end <= segment_duration * (i + 1)){
                                        speakers[speaker][segments][i] = [end - start, count];
                                    }
                                }
                            }
                        }
                        index++;
                    }
                    else{
                        let end = monologue[monologue.length - 1].end;

                        pause_in_monologue[pause_index] = [pause_start, end, count, speaker]

                        monologue_speed.push(...pause_in_monologue);
                        index += pause_index + 1;



                        pause_in_monologue.forEach(item => {
                            if (speakers[speaker]){
                                speakers[speaker][total][0] += item[1] - item[0];
                                speakers[speaker][total][1] += item[2];

                                if(true){ //(duration > segment_duration * 2){
                                    for (let i = 0; i < seg_count; i++){
                                        if(end <= segment_duration * (i + 1)){
                                            speakers[speaker][segments][i][0] += item[1] - item[0];
                                            speakers[speaker][segments][i][1] += item[2];
                                            speakers[speaker][segments][i][3] = item[1];
                                            break;
                                        }
                                    }
                                }
                            }
                            else{
                                speakers[speaker] = new Array(2);

                                speakers[speaker][total] = [item[1] - item[0], item[2]];

                                if(true){ //(duration > segment_duration * 2){
                                    speakers[speaker][segments] = new Array(seg_count);

                                    for (let i = seg_count - 1; i >= 0; i--){
                                        speakers[speaker][segments][i] = [0, 0];
                                        if(end <= segment_duration * (i + 1)){
                                            speakers[speaker][segments][i] = [item[1] - item[0], item[2], [item[1]]];

                                        }
                                    }
                                }


                            }
                        });
                    }
                }
                //console.log(speakers);

                for(const speaker in speakers){
                    speakers[speaker][total][2] = speakers[speaker][total][1] / (speakers[speaker][total][0] / 60);
                    if (true){ //(duration > segment_duration * 2){
                        for (i = 0; i < seg_count; i++){
                            if (speakers[speaker][segments][i][0] > 4){
                                speakers[speaker][segments][i][2] = speakers[speaker][segments][i][1] / (speakers[speaker][segments][i][0] / 60);
                            }
                            else{
                                if (i - 1 >= 0){
                                    speakers[speaker][segments][i][2] = speakers[speaker][segments][i - 1][2];
                                }
                                else{
                                    speakers[speaker][segments][i][2] = speakers[speaker][total][2];
                                }
                            }

                        }
                    }
                }
                //console.log(speakers);

                var speak_time = 0;
                for(const speaker in speakers){
                    speak_time += speakers[speaker][total][0];
                }
                for(const speaker in speakers){
                    call_wa_mean_smart_speed += speakers[speaker][total][2]*(speakers[speaker][total][0]/speak_time);
                }

                current_smart_speed = parseInt(call_wa_mean_smart_speed.toFixed(0)) + 5;

				max_smart_speed = current_smart_speed * 2.5;
				min_smart_speed = current_smart_speed;


                smart_speed_diff = current_smart_speed * .25;
            }
        })
            //.then((resolve)=>{create_volumes(d);})

    //}
    //async function create_volumes(d){
    //    let url = `https://volumeplay-69906.firebaseio.com/.json`;
    //    $.getJSON(url, function(data) {
    //        if (call_id in data && !isNaN(data[call_id][0])){
    //            volumes = data[call_id];

    //        }
    //    })
            .then(()=>{get_topics();})
            .then(()=>{create_silences(d);});
    }
    async function get_topics(){
        var segment_labels = document.getElementsByClassName("segment-label");
        var segment_label_colors = document.getElementsByClassName("fa-circle");

        var segments = document.getElementsByClassName("segment");

        for(var i = 0; i < segment_labels.length; i++){
            if(segment_labels[i].innerHTML.includes("Call Setup") || segment_labels[i].innerHTML.includes("Small Talk") ){
                for(var j = 0; j < segments.length; j++){
                    if (segments[j].style.background == segment_label_colors[i].style.color){
                        let start = (parseFloat(segments[j].style.left) / 100.0) * duration;
                        let end = ((parseFloat(segments[j].style.left) / 100.0) + (parseFloat(segments[j].style.width) / 100.0)) * duration;
                        irrelevent_topics.push([start, end]);

                    }
                }
            }
        }
    }
    async function create_silences(d){
        var index = 0, start = 0;
        if (monologue_speed.length > 0){
            for(let i = 0; i < monologue_speed.length; i++){
                if (monologue_speed[i][0] - start > reduces_seconds_under){
                    silences[index] = [start, monologue_speed[i][0]];
                    index++;
                }
                start = monologue_speed[i][1];
            }
        }
        else{
            for(let i = 0; i < d.monologues.length; i++){
                if (d.monologues[i].terms[0].start - start > reduces_seconds_under){
                    silences[index] = [start, d.monologues[i].terms[0].start];
                    index++;
                }
                start = d.monologues[i].terms[0].end;
            }
        }

        if (!(monologue_speed.length == 0 && silences.length == 0 && irrelevent_topics.length == 0 && !volumes)){
            create_interface2();
        }
    }


    function check() {
        var audioCtx = new AudioContext()
        var source = audioCtx.createMediaElementSource(video)
        var gainNode = audioCtx.createGain()
        gainNode.gain.value = 2 // double the volume
        source.connect(gainNode)
        gainNode.connect(audioCtx.destination)
    }


    function smart_button_click(button){
        var rate_wrapper = document.querySelectorAll(".playback-rates")[1];
        var smart_speed_rate_wrapper = document.getElementById("smartSpeedRateWrapper")
        user_wpm_display();
        if (chosen_options[is_smart]){
            button.style.color = "white";
            button.style.backgroundColor = "#812AC1";
            document.getElementById("smartTimeStamp").style.display = "inline";
            create_smart_duration();
            document.getElementById("smartTimeStamp").innerHTML = `(${time(smart_duration)})`;
            smart_speed_view();
            //current_speed = video.playbackRate;
            event_smart_speed(monologue_speed);
            event_reduce_silence(silences);
            event_skip_irrelevent_topics(irrelevent_topics);
            //event_smart_volume();
        }
        else{
            smart_speed_view();
            document.getElementById("smartTimeStamp").style.display = "none"

            button.style.color = "gray";
            button.style.backgroundColor = "rgb(239 239 239)";

        }
    }

    function smart_speed_view(){
        var rate_wrapper = document.querySelectorAll(".playback-rates")[1];
        var smart_speed_rate_wrapper = document.getElementById("smartSpeedRateWrapper")
        if (chosen_options[is_smart] && chosen_options[is_smart_speed]){
            rate_wrapper.style.display = "none";
            smart_speed_rate_wrapper.style.display = "inline-flex";
        }
        else{
            new Promise (function(resolve){
                resolve(video.playbackRate = current_speed)

            })
                .then(function(result){
                setTimeout(() => {
                rate_wrapper.style.display = "inline-flex";
                smart_speed_rate_wrapper.style.display = "none";}, 50);
            })
        }

    }

    function open_smart(e,smart_drop_down, smart_player_options, smart_button){
        if(!chosen_options[is_smart] && smart_button.contains(e.target) ){
                chosen_options[is_smart] = true;

                smart_button_click(smart_button);
            }
            else if(chosen_options[is_smart] && smart_button.contains(e.target) && !smart_drop_down.contains(e.target)){
                chosen_options[is_smart] = false;
                smart_button_click(smart_button);
            }
        //if clicked on v and menu not open
            if (smart_drop_down.contains(e.target) && !smart_player_options.querySelector(".fade").classList.contains("in")){
                smart_player_options.style.pointerEvents = "all";
                smart_player_options.querySelector(".fade").classList.add("in");
            } else{

                //if menu open and clicked inside it
                if (smart_player_options.contains(e.target) && smart_player_options.querySelector(".fade").classList.contains("in") && !smart_player_options.querySelector(".gong-icon-close").contains(e.target)){
                    smart_player_options.style.pointerEvents = "all";
                    smart_player_options.querySelector(".fade").classList.add("in");
                }
                //if clicked on v and menu not open
                else{
                    smart_player_options.style.pointerEvents = "none";
                    smart_player_options.querySelector(".fade").classList.remove("in");

                }
            }
        //current_speed = video.playbackRate;


    }

    function user_wpm_display(){
        if (chosen_options[is_smart]){
            document.getElementsByName('avgSpeakerSpeed').forEach(elem=> elem.style.display = "inline");
        }
        else{
            document.getElementsByName('avgSpeakerSpeed').forEach(elem=> elem.style.display = "none");
        }
    }

    async function create_interface2(){

        var smart_player_bool = document.createElement("div");

        smart_player_bool.innerHTML = '<div><button class="btn" id="smartButton"style="color: gray;">Smart<i style="margin-left: 10px; color: gray;" id="smartDropDown" class="fa fa-chevron-down drop-down-the-user-menu"></i></button></div>';
        smart_player_bool.style.position = "relative";
        smart_player_bool.style.display = "flex";

        //rate_wrapper.parentNode.insertBefore(smart_player_bool, rate_wrapper );

        var controls_left = document.querySelector(".video-player-controls__left");

        controls_left.insertBefore(smart_player_bool, controls_left.children[1]);

        var smart_player_info = document.createElement("div");
        smart_player_info.style.zIndex = "1000";
        smart_player_info.id = "smartPlayerOptions";


        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.smart-class {line-height: 30px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin: 5px 15px;}'+
            '.smart-class > *{margin:0;}'+
            '.smart-class > input{margin-bottom: 5px;}';
        document.getElementsByTagName('head')[0].appendChild(style);

        let speed_exist = ""
        if (monologue_speed.length > 0){
            chosen_options[is_smart_speed] = true;
            speed_exist = '<div class="smart-class">'
            +'<label for="smartSpeed">Smart Speed</label><input index="1" id="smartSpeed" type="checkbox" checked>'
            +'</div>'
        }

        let silences_exist = ""
        if (silences.length > 0){
            silences_exist = '<div class="smart-class">'
            +'<label for="reduceSilences">Reduce Silences</label><input index="2" id="reduceSilences" type="checkbox">'
            +'</div>'
        }

        let topics_exist = ""
        if (irrelevent_topics.length > 0){
            topics_exist = '<div class="smart-class">'
            +'<label for="skipTopics" title="Call Setup and Small Talk">Skip Small Talk</label><input index="3" id="skipTopics" type="checkbox">'
            +'</div>'
        }

        //let volume_exist = ""
        //if (volumes){
        //    volume_exist = '<div class="smart-class">'
        //    +'<label for="smartVolume">Smart Volume</label><input index="4" id="smartVolume" type="checkbox">'
        //    +'</div>'
        //}

        smart_player_info.innerHTML = '<div class="fade call-info-popover popover bottom" style="display: block; top:35px;max-width:250px; min-width:200px;">'
            //+'<div class="arrow" style="left: 30%;"></div>'
            +'<div class="call-info-title smart-class" style="margin-top:10px;">Smart'
            +`<span id="smartTimeStamp" style="display:none;color:#812AC1; margin-left: 10px;"> (${time(smart_duration)})</span>`
            +'<button target="" rel="" type="button" class="gong-btn gong-btn--link-secondary gong-btn--lg gong-btn-icon-only btn btn-default">'
            +'<i class="gong-btn__icon gong-icon-close"></i>'
            +'</button>'
            +'</div>'
            +'<div class="gong-divider "></div>'
            + speed_exist
            + silences_exist
            + topics_exist
            // + volume_exist
            +'</div>'
            +'</div>'

        smart_player_bool.appendChild(smart_player_info);

        var smart_drop_down = document.getElementById("smartDropDown");

        var smart_player_options = document.getElementById("smartPlayerOptions");

        var smart_button = document.getElementById("smartButton");

        window.addEventListener('click', function(e){
            open_smart(e, smart_drop_down, smart_player_options, smart_button)
        });//opens and closes smart player info and turns Smart on and off


        let inputs = smart_player_options.getElementsByTagName("input");
        for (let i = 0; i < inputs.length; i++){
            inputs[i].addEventListener('change',function(){
                chosen_options[inputs[i].getAttribute("index")] = this.checked;
                create_smart_duration();
                document.getElementById("smartTimeStamp").innerHTML = `(${time(smart_duration)})`;
                if (inputs[i].getAttribute("index") == is_smart_speed){
                    smart_speed_view();
                }
            });
        }

        var rate_wrapper = document.querySelector(".playback-rates");
        var smart_rates = document.createElement("div");

        smart_rates.classList.add("playback-rates");
        smart_rates.style.display = "none";
        smart_rates.id="smartSpeedRateWrapper"
        smart_rates.innerHTML = `<button id="smartRateUp" class="btn-rate-up"><i class="gong-icon-chevron-up-thin"></i></button><div id="smartRate">${Math.round((Math.round((current_smart_speed/call_wa_mean_smart_speed) * 4) / 4)*100)/100}x</div><button id="smartRateDown" class="btn-rate-down"><i class="gong-icon-chevron-down-thin"></i></button>`;

        rate_wrapper.parentNode.insertBefore(smart_rates, rate_wrapper );


        document.getElementById("smartRateUp").addEventListener("click", function(){
            if (current_smart_speed < max_smart_speed){
                current_smart_speed += smart_speed_diff;
                create_smart_duration();
            }
            document.getElementById("smartTimeStamp").innerHTML = `(${time(smart_duration)})`;
            document.getElementById("smartRate").innerHTML = Math.round((Math.round((current_smart_speed/call_wa_mean_smart_speed) * 4) / 4)*100)/100 + "x";

        });
        document.getElementById("smartRateDown").addEventListener("click", function(){
            if (current_smart_speed > min_smart_speed){
                current_smart_speed -= smart_speed_diff;
                create_smart_duration();
            }
            document.getElementById("smartTimeStamp").innerHTML = `(${time(smart_duration)})`;
            document.getElementById("smartRate").innerHTML = Math.round((Math.round((current_smart_speed/call_wa_mean_smart_speed) * 4) / 4)*100)/100 + "x";
        });

        document.getElementsByClassName("btn-rate-up")[1].addEventListener("click", function(){
            new Promise (function(resolve){
                setTimeout(() => resolve(), 100);
            })
                .then(function(result){
                current_speed = video.playbackRate;
                create_smart_duration();
                document.getElementById("smartTimeStamp").innerHTML = `(${time(smart_duration)})`;
            })
        });
        document.getElementsByClassName("btn-rate-down")[1].addEventListener("click", function(){
            new Promise (function(resolve){
                setTimeout(() => resolve(), 100);
            })
                .then(function(result){
                current_speed = video.playbackRate;
                create_smart_duration();
                document.getElementById("smartTimeStamp").innerHTML = `(${time(smart_duration)})`;
            })
        });

        var speaker_in_document = document.querySelectorAll('.speaker')



        //speed per minute for each speaker
        for (var i = 0; i < speaker_in_document.length; i++){
            var avg_speaker_speed = document.createElement("span");
            avg_speaker_speed.classList.add("speaker-name");
            avg_speaker_speed.style.display = "none";
            avg_speaker_speed.setAttribute("name","avgSpeakerSpeed");
            avg_speaker_speed.innerHTML = `  ${speakers[Number(speaker_in_document[i].getAttribute('data-speaker-id'))][total][2].toFixed(0)} wpm`;
            avg_speaker_speed.style.color = "#812AC1";

            //speaker_in_document[i].getElementsByClassName('speaker-identity')[0].appendChild(avg_speaker_speed) //last in list
            speaker_in_document[i].getElementsByClassName('speaker-identity')[0].insertBefore(avg_speaker_speed, speaker_in_document[i].getElementsByClassName('speaker-identity')[0].childNodes[1])
        }


    }





    $(document).ready(function() {
        video = get_video();
        var url = new URL(window.location);
        call_id = url.searchParams.get("id");
        if (call_id) {
            var json = `https://app.gong.io/call/json-transcript?call-id=${call_id}`;
            //check();
            create_speed(json)



        }
    });

})();
