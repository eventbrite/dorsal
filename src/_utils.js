/*
 * Copyright 2014 Eventbrite
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var createGUID = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
           .toString(16)
           .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
    };
})();

function isHTMLElement(node) {
    return node.nodeType === 1;
}

// Handles `document`
function isDOM(node) {
    return node.nodeType === 9;
}

function arrayIndexOf(arr, value) {
    var lengthOfArr = arr.length,
        i = 0;

    if (arr.indexOf) {
        return arr.indexOf(value);
    }

    for (; i < lengthOfArr; i++) {
        if (arr[i] === value) {
            return i;
        }
    }

    return -1;
}

// from: http://underscorejs.org/docs/underscore.html#section-94
// except: not dealing with the bug with enum though.

function keysFor(obj) {
    var keys = [],
        key;

    if (!obj) {
        return keys;
    }

    if (Object.keys) {
        return Object.keys(obj);
    }

    for (key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            keys.push(key);
        }
    }

    return keys;
}
