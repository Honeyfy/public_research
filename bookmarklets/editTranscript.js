// ==UserScript==
// @name         Edit Transcript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Edit transcripts in Gong's website
// @author       Vitaliy Rybnikov, Omri Allouche
// @match        https://app.gong.io/call/pretty-transcript?call-id=*
// @grant        none
// @downloadURL https://honeyfy.github.io/public_research/bookmarklets/editTranscript.js
// ==/UserScript==

(function () {
    function Diff() { }

    Diff.prototype = {
        diff(oldString, newString, options = {}) {
            let callback = options.callback;
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            this.options = options;

            let self = this;

            function done(value) {
                if (callback) {
                    setTimeout(function () { callback(undefined, value); }, 0);
                    return true;
                } else {
                    return value;
                }
            }
            oldString = this.castInput(oldString);
            newString = this.castInput(newString);

            oldString = this.removeEmpty(this.tokenize(oldString));
            newString = this.removeEmpty(this.tokenize(newString));

            let newLen = newString.length, oldLen = oldString.length;
            let editLength = 1;
            let maxEditLength = newLen + oldLen;
            let bestPath = [{ newPos: -1, components: [] }];

            let oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
            if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
                return done([{ value: this.join(newString), count: newString.length }]);
            }

            function execEditLength() {
                for (let diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
                    let basePath;
                    let addPath = bestPath[diagonalPath - 1],
                        removePath = bestPath[diagonalPath + 1],
                        oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
                    if (addPath) {
                        bestPath[diagonalPath - 1] = undefined;
                    }

                    let canAdd = addPath && addPath.newPos + 1 < newLen,
                        canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
                    if (!canAdd && !canRemove) {
                        bestPath[diagonalPath] = undefined;
                        continue;
                    }
                    if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
                        basePath = clonePath(removePath);
                        self.pushComponent(basePath.components, undefined, true);
                    } else {
                        basePath = addPath;
                        basePath.newPos++;
                        self.pushComponent(basePath.components, true, undefined);
                    }

                    oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);
                    if (basePath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
                        return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
                    } else {
                        bestPath[diagonalPath] = basePath;
                    }
                }

                editLength++;
            }
            if (callback) {
                (function exec() {
                    setTimeout(function () {
                        if (editLength > maxEditLength) {
                            return callback();
                        }

                        if (!execEditLength()) {
                            exec();
                        }
                    }, 0);
                }());
            } else {
                while (editLength <= maxEditLength) {
                    let ret = execEditLength();
                    if (ret) {
                        return ret;
                    }
                }
            }
        },

        pushComponent(components, added, removed) {
            let last = components[components.length - 1];
            if (last && last.added === added && last.removed === removed) {
                components[components.length - 1] = { count: last.count + 1, added: added, removed: removed };
            } else {
                components.push({ count: 1, added: added, removed: removed });
            }
        },
        extractCommon(basePath, newString, oldString, diagonalPath) {
            let newLen = newString.length,
                oldLen = oldString.length,
                newPos = basePath.newPos,
                oldPos = newPos - diagonalPath,

                commonCount = 0;
            while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
                newPos++;
                oldPos++;
                commonCount++;
            }

            if (commonCount) {
                basePath.components.push({ count: commonCount });
            }

            basePath.newPos = newPos;
            return oldPos;
        },

        equals(left, right) {
            if (this.options.comparator) {
                return this.options.comparator(left, right);
            } else {
                return left === right
                    || (this.options.ignoreCase && left.toLowerCase() === right.toLowerCase());
            }
        },
        removeEmpty(array) {
            let ret = [];
            for (let i = 0; i < array.length; i++) {
                if (array[i]) {
                    ret.push(array[i]);
                }
            }
            return ret;
        },
        castInput(value) {
            return value;
        },
        tokenize(value) {
            return value.split('');
        },
        join(chars) {
            return chars.join('');
        }
    };

    function buildValues(diff, components, newString, oldString, useLongestToken) {
        let componentPos = 0,
            componentLen = components.length,
            newPos = 0,
            oldPos = 0;

        for (; componentPos < componentLen; componentPos++) {
            let component = components[componentPos];
            if (!component.removed) {
                if (!component.added && useLongestToken) {
                    let value = newString.slice(newPos, newPos + component.count);
                    value = value.map(function (value, i) {
                        let oldValue = oldString[oldPos + i];
                        return oldValue.length > value.length ? oldValue : value;
                    });

                    component.value = diff.join(value);
                } else {
                    component.value = diff.join(newString.slice(newPos, newPos + component.count));
                }
                newPos += component.count;

                if (!component.added) {
                    oldPos += component.count;
                }
            } else {
                component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
                oldPos += component.count;
                if (componentPos && components[componentPos - 1].added) {
                    let tmp = components[componentPos - 1];
                    components[componentPos - 1] = components[componentPos];
                    components[componentPos] = tmp;
                }
            }
        }

        let lastComponent = components[componentLen - 1];
        if (componentLen > 1
            && typeof lastComponent.value === 'string'
            && (lastComponent.added || lastComponent.removed)
            && diff.equals('', lastComponent.value)) {
            components[componentLen - 2].value += lastComponent.value;
            components.pop();
        }

        return components;
    }

    function clonePath(path) {
        return { newPos: path.newPos, components: path.components.slice(0) };
    }

    const extendedWordChars = /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;

    const reWhitespace = /\S/;

    const wordDiff = new Diff();
    wordDiff.equals = function (left, right) {
        if (this.options.ignoreCase) {
            left = left.toLowerCase();
            right = right.toLowerCase();
        }
        return left === right || (this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right));
    };
    wordDiff.tokenize = function (value) {
        let tokens = value.split(/(\s+|[()[\]{}'"]|\b)/);
        for (let i = 0; i < tokens.length - 1; i++) {
            if (!tokens[i + 1] && tokens[i + 2]
                && extendedWordChars.test(tokens[i])
                && extendedWordChars.test(tokens[i + 2])) {
                tokens[i] += tokens[i + 2];
                tokens.splice(i + 1, 2);
                i--;
            }
        }

        return tokens;
    };

    function diffWordsWithSpace(oldStr, newStr, options) {
        return wordDiff.diff(oldStr, newStr, options);
    }

    const rootUrl = 'https://test.com/edit_transcript'

    const getCallId = () => {
        const time = document.querySelector('a.timestamp')
        const href = time.href
        if (href) {
            const urlParams = (new URL(href)).searchParams
            return urlParams.get('id')
        }
        return null
    }

    const request = (url = '', method = 'POST', data = {}) => {
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

    let url = new URL(window.location)
    let callId = decodeURIComponent(url.searchParams.get('call-id'));
    if (!callId) callId = decodeURIComponent(url.searchParams.get('id'));
    if (!callId) callId = getCallId()
    

    const findTextNode = (elem) => {
        for (var nodes = elem.childNodes, i = nodes.length; i--;) {
            var node = nodes[i], nodeType = node.nodeType;
            if (nodeType == Node.TEXT_NODE) {
                return node
            }
        }
        return null
    }

    const applyStyle = (el, styleObj) => {
        for (let key in styleObj) {
            el.style[key] = styleObj[key]
        }
    }

    const applyAttrs = (el, attrsObject) => {
        for (let key in attrsObject) {
            el.setAttribute(key, attrsObject[key])
        }
    }

    const crel = (elementTag, elementAttrs, elementStyle, elementText) => {
        const el = document.createElement(elementTag)
        elementAttrs && applyAttrs(el, elementAttrs)
        elementStyle && applyStyle(el, elementStyle)
        if (elementText) {
            el.textContent = elementText
        }
        return el
    }

    const load = () => {
        if (callId) {
            const currentStored = window.localStorage.getItem('gong_edit_bookmarklet');
            try {
                const currentStoredObj = JSON.parse(currentStored)
                if (currentStoredObj && currentStoredObj[callId]) {
                    return currentStoredObj[callId]
                }
            } catch (e) {
                console.error('error loading local storage', e)
            }
        }
        return null
    }

    const save = (idx, newText) => {
        if (!callId) {
            return
        }
        const currentStored = window.localStorage.getItem('gong_edit_bookmarklet')
        if (currentStored && currentStored.length) {
            try {
                const currentStoredObj = JSON.parse(currentStored)
                if (!currentStoredObj[callId]) {
                    currentStoredObj[callId] = {}
                }
                currentStoredObj[callId][idx] = newText
                window.localStorage.setItem('gong_edit_bookmarklet', JSON.stringify(currentStoredObj))
            } catch (e) {
                console.error('error saving local storage')
            }
        } else {
            const store = {}
            store[callId] = {}
            store[callId][idx] = newText
            window.localStorage.setItem('gong_edit_bookmarklet', JSON.stringify(store))
        }
    }

    const buttonsContainer = crel('div', null, {
        position: 'sticky',
        top: '0px',
        display: 'flex',
        width: '100vw',
        justifyContent: 'space-around'
    });

    let showEdits = true

    const toggleEdits = (e) => {
        showEdits = !showEdits
        e.target.textContent = showEdits ? 'Hide text edits' : 'Show text edits'

        const contentSpans = document.querySelectorAll('.gb__content')
        const originalSpans = document.querySelectorAll('.gb__original')
        contentSpans.forEach((cs) => {
            cs.style.display = showEdits ? null : 'none'
        })
        originalSpans.forEach((os) => {
            os.style.display = showEdits ? 'none' : null
        })
    }

    const download = (content, fileName) => {
        var a = document.createElement('a');
        var file = new Blob([content], {type: 'text/json'})
        a.href = URL.createObjectURL(file)
        a.download = fileName
        a.click()
        a.remove()
    }

    const saveEdits = (local = false) => {
        const texts = [...document.querySelectorAll('p.text')]
        const payload = {
            call_id: callId,
            edits: []
        }
        texts.forEach((t, index) => {
            const originalText = t.querySelector('.gb__original').textContent.trim()
            const newText = t.querySelector('.gb__content').textContent.trim()
            const time = t.querySelector('a').textContent.trim()
            if (originalText !== newText) {
                payload.edits.push({
                    index,
                    newText,
                    originalText,
                    time
                })
            }
        })
        if (payload.edits.length) {
            if (!local) {
                payload.url = document.location.href
                request(rootUrl, 'POST', payload)
            } else {
                download(JSON.stringify(payload), `${callId}.json`)
            }
        }
    }

    const buttons = [
        {
            name: 'Hide text edits',
            backgroundColor: 'rgb(111, 181, 3)',
            color: 'rgb(255, 255, 255)',
            onClick: (e) => {
                toggleEdits(e)
            }
        },
        {
            name: 'Save edits locally',
            backgroundColor: 'rgb(245, 137, 189)',
            color: 'rgb(255, 255, 255)',
            onClick: (e) => {
                saveEdits(true)
            }
        },
        {
            name: 'Save edits to server',
            backgroundColor: 'rgb(245, 137, 189)',
            color: 'rgb(255, 255, 255)',
            onClick: (e) => {
                saveEdits()
            }
        }
    ];

    buttons.forEach((b) => {
        const button = crel('div', {}, {
            display: 'flex',
            backgroundColor: b.backgroundColor,
            color: b.color,
            borderRadius: '4px',
            padding: '.5rem',
            cursor: 'pointer'
        });
        button.textContent = `${b.name}`;

        buttonsContainer.appendChild(button);

        button.addEventListener('click', (e) => b.onClick(e));
    });

    const body = document.querySelector('body');
    body.insertBefore(buttonsContainer, body.firstChild);

    const texts = [...document.querySelectorAll('p.text')]
    const stored = load()

    const computeDiff = (contentSpan, oldText, newText) => {
        const diff = diffWordsWithSpace(oldText, newText)
        let spanHtml = ''
        for (var i = 0; i < diff.length; i++) {
            if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
                var swap = diff[i];
                diff[i] = diff[i + 1];
                diff[i + 1] = swap;
            }

            if (diff[i].removed) {
            } else if (diff[i].added) {
                spanHtml += `<span style="color:green;">${diff[i].value}</span>`
            } else {
                spanHtml += diff[i].value
            }
        }
        contentSpan.innerHTML = spanHtml
    }

    const click = (el, x, y) => {
        var ev = new MouseEvent('mousedown', {
            'view': window,
            'bubbles': true,
            'cancelable': true,
            'screenX': x,
            'screenY': y
        });

        el.dispatchEvent(ev);
    }

    texts.forEach((t, idx) => {
        let originalElementText = ''
        const style = window.getComputedStyle(t, null).getPropertyValue('font-size')
        const elementFontSize = parseFloat(style)

        const elementTextNode = findTextNode(t)
        originalElementText = elementTextNode.textContent.trim()
        t.removeChild(elementTextNode)

        const spanText = stored && stored[idx] ? stored[idx] : originalElementText

        const contentSpan = crel('span', { class: 'gb__content' }, { fontSize: elementFontSize + 'px' }, spanText)
        computeDiff(contentSpan, originalElementText, spanText)
        t.appendChild(contentSpan)

        const span = crel('span', { class: 'gb__editable', contenteditable: true }, { display: 'none', fontSize: elementFontSize + 'px' }, spanText)
        t.appendChild(span)

        const originalSpan = crel('span', { class: 'gb__original' }, { display: 'none', fontSize: elementFontSize + 'px' }, originalElementText)
        t.appendChild(originalSpan)

        span.addEventListener('blur', () => {
            const newText = span.textContent
            span.style.display = 'none'
            contentSpan.style.display = null
            if (newText.length) {
                contentSpan.textContent = newText
                save(idx, newText)
            } else {
                span.textContent = originalElementText
            }
            computeDiff(contentSpan, originalElementText, newText)
        })

        span.addEventListener('keydown', (e) => {
            if (e.keyCode === 13 || e.keyCode === 27) {
                e.preventDefault()
                span.blur()
            }
        })

        contentSpan.addEventListener('mousedown', (e) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            span.style.display = null
            contentSpan.style.display = 'none'
            span.focus()
            setTimeout(() => {
                click(span, e.screenX, e.screenY)
                span.dispatchEvent(e)
            }, 100)
        })
    })
}())