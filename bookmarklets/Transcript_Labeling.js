// ==UserScript==
// @name         Transcript Labeling
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://app.gong.io/call/pretty-transcript?call-id=*
// @grant        none
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/Transcript_Labeling.js
// ==/UserScript==

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

(function() {
    let currentSelection = null;
    const rootUrl = "https://test.com/labeling"
    const labelsElements = [];
    const texts = [];
    const originalTexts = [];
    let annotations = [];
    var url = new URL(window.location);
	var callId = decodeURIComponent(url.searchParams.get("call-id"));
    if (!callId) callId = decodeURIComponent(url.searchParams.get("id"));


    function downloadData(){
        //var callId = window.location.href.split('=').last();
        var filename = callId + '.csv';
        var data = 'label,text,timestamp,link\n';

        annotations.forEach(a=>{
            data += `${a.label},"${a.text}",${a.time},${a.link}\n`
        });


        if(!filename) filename = 'TranscriptLabeling.csv';

        var blob = new Blob([data], {type: 'text/json'});
        var e = document.createEvent('MouseEvents');
        var a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }

    function applyStyle(el, styleObj) {
        for (var key in styleObj) {
            el.style[key] = styleObj[key];
        }
    }

    function applyAttrs(el, attrsObject) {
        for (var key in attrsObject) {
            el.setAttribute(key, attrsObject[key]);
        }
    }

    function setLabelsEnabled(enable) {
        labelsElements.forEach(le => {
            applyStyle(le, {
                opacity: enable ? '' : '0.5',
                cursor: enable ? 'pointer' : 'not-allowed'
            })
        });
    }

    function wrap(el, wrapper) {
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    }

    function findTextNode(elem) {
        for (var nodes = elem.childNodes, i = nodes.length; i--;) {
            var node = nodes[i], nodeType = node.nodeType;
            if (nodeType == Node.TEXT_NODE) {
              return node
            }
        }
        return null
    }

    function makeLabel(startOffset, endOffset) {
        const label = {
            labelId: -1,
            startOffset,
            endOffset,
          };
          return label;
    }

    function annotationsMap() {
        const ret = {}
        for (let i = 0; i < texts.length; i++) {
            ret[i] = []
        }
        annotations.sort((a, b) => a.startOffset - b.startOffset).forEach(a => {
            const idx = a.elIndex;
            ret[idx].push(Object.assign({}, a));
        });
        return ret;
    }

    function storeAnnotations() {
        const currentStored = window.localStorage.getItem('gong_labeling_bookmarklet')
        if (currentStored && currentStored.length) {
            try {
                const currentStoredObj = JSON.parse(currentStored);
                currentStoredObj[callId] = annotations;
                window.localStorage.setItem('gong_labeling_bookmarklet', JSON.stringify(currentStoredObj));
            } catch(e) {
                console.error('error saving local storage');
            }
        } else {
            const store = {}
            store[callId] = annotations;
            window.localStorage.setItem('gong_labeling_bookmarklet', JSON.stringify(store));
        }
    }

    function renderAnnotation(currentAnnotations, index, annotationIndex) {
        const rootEl = texts[index];
        const originalText = originalTexts[index];
        while (rootEl.firstChild) {
            rootEl.removeChild(rootEl.firstChild);
        }

        currentAnnotations.forEach((a, aIdx) => {
            const span = crel('span', { class: a.labelId >= 0 ? 'annotation' : 'not-annotated' }, {
                backgroundColor: a.labelId >= 0 ? labels[a.labelId].backgroundColor : ''
            });
            span.textContent = originalText.substring(a.startOffset, a.endOffset)
            if (a.labelId >= 0) {
                let btn
                span.addEventListener('mouseenter', (e) => {
                    btn = crel('button', null, null);
                    btn.textContent = 'x';
                    btn.addEventListener('click', () => {
                        request(rootUrl, 'DELETE', a);
                        const idx = annotations.findIndex((ac) => {
                            return ac.elIndex === a.elIndex && ac.startOffset === a.startOffset && ac.endOffset === a.endOffset
                        });
                        if (idx >= 0) {
                            annotations.splice(idx, 1);
                        }
                        btn.remove();
                        renderAnnotations();
                        storeAnnotations();
                    })
                    span.appendChild(btn);
                })
                span.addEventListener('mouseleave', (e) => {
                    btn.remove();
                })
            }

            rootEl.appendChild(span);
        });
    }

    function renderAnnotations() {
        const annotMap = annotationsMap();
        const ret = {};
        if (annotMap) {
            for (var idx in annotMap) {
                const res = [];
                const text = originalTexts[idx];
                let left = 0;
                for (let i = 0; i < annotMap[idx].length; i++) {
                    const e = annotMap[idx][i];
                    const l = makeLabel(left, e.startOffset);
                    res.push(l);
                    res.push(e);
                    left = e.endOffset
                }
                const l = makeLabel(left, text.length);
                res.push(l);
                ret[idx] = res;
            }

            for (var key in ret) {
                renderAnnotation(ret[key], key, annotations.indexOf(ret[key]));
            }
        } else {
            texts.forEach((t, idx) => {
                while (t.firstChild) {
                    t.removeChild(t.firstChild);
                }
                t.textContent = originalTexts[idx];
            })
        }
    }

    function annotatateSelected(label) {
        if (currentSelection) {
            const element = currentSelection.focusNode;
            const ancestor = findClassAncestor(element, 'text-labeling');
            const range = currentSelection.getRangeAt(0);
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(ancestor);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            start = preSelectionRange.toString().length;
            end = start + range.toString().length;
            const elIndex = parseInt(ancestor.getAttribute('data-index'));
            if (checkValidRange(start, end, elIndex)) {
                annotations.push({
                    startOffset: start,
                    endOffset: end,
                    label: label.name,
                    labelId: label.id,
                    elIndex,
                    text: currentSelection.toString(),
                    time: ancestor.parentElement.firstElementChild.text.slice(0, -1),
                    link: ancestor.parentElement.firstElementChild.href
                });
                request(rootUrl, 'POST', {
                    url: document.location.href,
                    text: currentSelection.toString(),
                    label: label.name
                })
                renderAnnotations();
                storeAnnotations();
            } else {
            }
        }
    }

    function crel(elementTag, elementAttrs, elementStyle) {
        const ret = document.createElement(elementTag);
        elementAttrs && applyAttrs(ret, elementAttrs);
        elementStyle && applyStyle(ret, elementStyle);
        return ret;
    }

    function wrapTexts() {
        const textsEls = document.querySelectorAll('.text')
        textsEls.forEach((t, idx) => {
            const textNode = findTextNode(t);
            if (textNode) {
                textNode.textContent = textNode.textContent.trim();
                originalTexts.push(textNode.textContent);
                const wrapper = crel('span', { class: 'text-labeling', 'data-index': idx });
                wrap(textNode, wrapper);
                texts.push(wrapper);
            }
        })
    }

    function request(url = '', method = 'POST', data = {}) {
          return fetch(url, {
              method,
              mode: 'cors',
              cache: 'no-cache',
              headers: {
                  'Content-Type': 'application/json'
              },
              redirect: 'follow',
              referrer: 'no-referrer',
              body: JSON.stringify(data)
          })
          .then(response => response.json());
      }

    function checkValidRange(startOffset, endOffset, elementIndex) {
        const annotMap = annotationsMap();
        if (!annotMap || !annotMap[elementIndex]) {
            return true;
        };

        for (let i = 0; i < annotMap[elementIndex].length; i++) {
            const e = annotMap[elementIndex][i];
            if ((e.startOffset <= startOffset) && (startOffset < e.endOffset)) {
                return false;
            }
            if ((e.startOffset < endOffset) && (endOffset < e.endOffset)) {
                return false;
            }
            if ((startOffset < e.startOffset) && (e.startOffset < endOffset)) {
                return false;
            }
            if ((startOffset < e.endOffset) && (e.end_offset < endOffset)) {
                return false;
            }
        }
        return true;
    }

    const labelsContainer = crel('div', null, {
        position: 'sticky',
        top: '0px',
        display: 'flex',
        width: '50vw',
        justifyContent: 'space-around'
    });

    const labels = [
        {
            name: 'Time',
            backgroundColor: '#a94dec',
            color: 'rgb(255, 255, 255)',
            id:0,
            hotkey: '1'
        },
        {
            name: 'Purpose',
            backgroundColor: '#54F2D9',
            color: 'rgb(255, 255, 255)',
            id:1,
            hotkey: '2'
        },
        {
            name: 'Prospect Agenda',
            backgroundColor: '#fbeb9b',
            color: 'rgb(255, 255, 255)',
            id:2,
            hotkey: '3'
        },
        {
            name: 'Rep Agenda',
            backgroundColor: '#f58230',
            color: 'rgb(255, 255, 255)',
            id:3,
            hotkey: '4'
        },
        {
            name: 'Outcome',
            backgroundColor: '#3cb44b',
            color: 'rgb(255, 255, 255)',
            id:4,
            hotkey: '5'
        },
        {
            name: 'Concern',
            backgroundColor: '#008080',
            color: 'rgb(255, 255, 255)',
            id:5,
            hotkey: '6'
        }
    ];

    labels.forEach(function(l) {
        const label = crel('div', {}, {
            display: 'flex',
            backgroundColor: l.backgroundColor,
            color: l.color,
            borderRadius: '4px',
            padding: '.5rem',
            cursor: 'pointer'
        });
        label.textContent = `${l.name} (${l.hotkey.toUpperCase()})`;

        labelsContainer.appendChild(label);
        labelsElements.push(label);

        label.addEventListener('mousedown', () => annotatateSelected(l));
    });

    const body = document.querySelector('body');
    body.insertBefore(labelsContainer, body.firstChild);
    const saveButton = crel('button', {}, {
            display: 'flex',
            borderRadius: '4px',
            padding: '.5rem',
            cursor: 'pointer'
        });

    saveButton.textContent = 'SAVE';
    saveButton.addEventListener('click', ()=>{
        downloadData();
    });

    labelsContainer.insertBefore(saveButton, labelsContainer.firstChild);
    const findClassAncestor = (el, cl) => {
        while (el && ((el.classList && !el.classList.contains(cl)) || !el.classList) && el.tagName !== 'BODY') {
            el = el.parentNode;
        }
        return el
    };

    document.addEventListener('selectionchange', () => {
        const selection = document.getSelection();
        const ancestor = findClassAncestor(selection.focusNode, 'text-labeling');
        if (selection.focusNode === selection.anchorNode && ancestor && ancestor.classList.contains('text-labeling') && selection.toString().length) {
            currentSelection = selection;
            setLabelsEnabled(true);
        } else {
            currentSelection = null;
            setLabelsEnabled(false);
        }
    });
    setLabelsEnabled(false);
    wrapTexts()

    const currentStored = window.localStorage.getItem('gong_labeling_bookmarklet');
    try {
        const currentStoredObj = JSON.parse(currentStored);
        if (currentStoredObj && currentStoredObj[callId]) {
            annotations = currentStoredObj[callId];
            renderAnnotations();
        }
    } catch (e) {
        console.error('error loading local storage', e);
    }

    document.addEventListener('keypress', (e) => {
        labels.forEach(l => {
            const charCode = l.hotkey.toUpperCase().charCodeAt(0);
            const keyCode = e.key.toUpperCase().charCodeAt(0);
            if (keyCode === charCode) {
                annotatateSelected(l);
            }
        })
    })

}())
