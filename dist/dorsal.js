/**
 * @license
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

/*! dorsal - v0.6.5 - 2016-09-30 */

(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['Dorsal'] = factory();
    }
}(this, function() {

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

var DorsalCore = function() {};

/**
* @namespace Dorsal
*
* @property {string} Dorsal.VERSION - current Version
* @property {DATA_PREFIX} Dorsal.DATA_PREFIX - prefix for attributes used by Dorsal
* @property {DATA_DORSAL_WIRED} Dorsal.DATA_DORSAL_WIRED - data attribute used for internal management
* @property {GUID_KEY} Dorsal.GUID_KEY - data attribute added to each element wired
* @property {CSS_PREFIX} Dorsal.CSS_PREFIX - prefix for any wirable pluginName
* @property {DEBUG} Dorsal.DEBUG - prefix for any wirable pluginName
*/

DorsalCore.prototype.VERSION = '0.6.3';
DorsalCore.prototype.CSS_PREFIX = '.js-d-';
DorsalCore.prototype.DATA_IGNORE_PREFIX = 'xd';
DorsalCore.prototype.DATA_PREFIX = 'd';
DorsalCore.prototype.DATA_DORSAL_WIRED = 'data-' + DorsalCore.prototype.DATA_IGNORE_PREFIX + '-wired';
DorsalCore.prototype.GUID_KEY = 'dorsal-guid';
DorsalCore.prototype.ELEMENT_TO_PLUGINS_MAP = {};
DorsalCore.prototype.DEBUG = false;
DorsalCore.prototype.plugins = {};

DorsalCore.prototype.registerPlugin = function(pluginName, callback) {
    this.plugins[pluginName] = callback;
};

/**
* @function Dorsal.unregisterPlugin
* @description unregister a given plugin
* @param {string} pluginName Plugin Name
*/
DorsalCore.prototype.unregisterPlugin = function(pluginName) {
    delete this.plugins[pluginName];
};

DorsalCore.prototype._getDatasetAttributes = function(el) {
    var dataset = el.dataset,
        dataAttributes = {};

    for (var key in dataset) {
        if ((new RegExp('^' + this.DATA_PREFIX + '[A-Z]')).test(key)) {
            var name = key.substr(this.DATA_PREFIX.length),
                outputKey = name[0].toLowerCase() + name.substr(1);

            dataAttributes[outputKey] = dataset[key];
        }
    }

    return dataAttributes;
};

DorsalCore.prototype._normalizeDataAttribute =  function(attr) {
    return attr.toUpperCase().replace('-','');
};

/**
 *
 * @function Dorsal._getDataAttributes
 * @param {DomNode} el
 * @return {Object} all the data attributes present in a given node
 * @private
 */
DorsalCore.prototype._getDataAttributes = function(el) {
    var dataAttributes = {},
        attributes = el.attributes,
        attributesLength = attributes.length,
        nameAttribute = 'name',
        i = 0;

    for (i = 0; i < attributesLength; i++) {
        if ((new RegExp('^data-' + this.DATA_PREFIX + '-')).test(attributes[i][nameAttribute])) {
            var name = attributes[i][nameAttribute].substr(5 + this.DATA_PREFIX.length + 1)
                                                   .toLowerCase()
                                                   .replace(/(\-[a-zA-Z])/g, this._normalizeDataAttribute);
            dataAttributes[name] = attributes[i].value;
        }
    }

    return dataAttributes;
};

/**
 * @function Dorsal._getAttributes
 * @param {DomNode} el
 * @returns {Object} all the data attributes present in the given node
 * @private
 */
DorsalCore.prototype._getAttributes = function(el) {
    if (el.dataset) {
        return this._getDatasetAttributes(el);
    }

    return this._getDataAttributes(el);
};

DorsalCore.prototype._runPlugin = function(el, pluginName) {
    // if already initialized, don't reinitialize
    var log = new DorsalLog(this.DEBUG);

    if (el.getAttribute(this.DATA_DORSAL_WIRED) && el.getAttribute(this.DATA_DORSAL_WIRED).indexOf(pluginName) !== -1) {
        log.log('node already wired: ' + el);
        return false;
    }

    var data = this._getAttributes(el),
        wiredAttribute = el.getAttribute(this.DATA_DORSAL_WIRED),
        plugin = this.plugins[pluginName],
        options = {
            el: el,
            data: data
        },
        elementGUID = el.getAttribute(this.GUID_KEY);

    if (!elementGUID) {
        elementGUID = createGUID();
        el.setAttribute(this.GUID_KEY, elementGUID);
        this.ELEMENT_TO_PLUGINS_MAP[elementGUID] = {};
    }

    log.log('plugin execution start', {guid: elementGUID, pluginName: pluginName});

    if (typeof plugin === 'function') {
        this.ELEMENT_TO_PLUGINS_MAP[elementGUID][pluginName] = plugin.call(el, options);
    } else if (typeof plugin === 'object') {
        this.ELEMENT_TO_PLUGINS_MAP[elementGUID][pluginName] = plugin.create.call(el, options);
    }

    log.log('plugin execution end', {guid: elementGUID, pluginName: pluginName});

    if (wiredAttribute) {
        el.setAttribute(this.DATA_DORSAL_WIRED, wiredAttribute + ' ' + pluginName);
    } else {
        el.setAttribute(this.DATA_DORSAL_WIRED, pluginName);
    }

    return elementGUID;
};

/**
 * @function Dorsal.registeredPlugins
 * @description will return each plugin name registered
 * @return {Array} registered plugin names
 */
DorsalCore.prototype.registeredPlugins = function() {
    var pluginKeys = keysFor(this.plugins);

    if (!pluginKeys.length) {
        if (console && console.warn) {
            console.warn('No plugins registered with Dorsal');
        }
    }

    return pluginKeys;
};

/**
 * @function Dorsal._wireElementsFrom
 * @param {DomNode} parentNode
 * @param {Promise} deferred object to proxy to the next method
 * @private
 */
DorsalCore.prototype._wireElementsFrom = function(parentNode) {
    var isValidNode = parentNode && 'querySelectorAll' in parentNode,
        plugins = this.registeredPlugins(),
        index = 0,
        pluginName,
        pluginCSSClass,
        nodes,
        response,
        responses = [];

    if (!isValidNode) {
        log.log('invalid Node: '+ prentNode);
        return;
    }

    pluginName = plugins[index++];

    while(pluginName) {
        nodes = parentNode.querySelectorAll(this.CSS_PREFIX + pluginName);

        if (nodes.length) {
            response = this._wireElements(nodes, [pluginName]);
            responses = responses.concat(response);
        }
        pluginName = plugins[index++];
    }
    return responses;
};

/**
 * @function Dorsal._wireElements
 * @param {DomNode[]} nodes dom nodes to wire
 * @param {Array|String} plugins plugins to wire the given nodes.
 * @param {Promise} deferred object to proxy to the next method
 * @private
 */
DorsalCore.prototype._wireElements = function(nodes, plugins) {
    if (!nodes.length) {
        var log = new DorsalLog(this.DEBUG);

        log.log('no nodes to wire: ' + nodes);
        return;
    }

    var nodeIndex = 0,
        node = nodes[nodeIndex++],
        responses = [];

    while(node) {
        responses.push(this._wireElement(node, plugins));
        node = nodes[nodeIndex++];
    }
    return responses;
};
/**
 * @function Dorsal._wireElement
 * @param {DomNode} nodes DomNodes to wire
 * @param {String|Array} plugins plugins to wire the given nodes.
 * @param {Promise} deferred object to proxy to the next method
 * @private
 */
DorsalCore.prototype._wireElement = function(el, plugins) {
    var self = this,
        dfd = new DorsalDeferred(),
        log = new DorsalLog(this.DEBUG);

    window.setTimeout(function() {
        var validElement = el && 'className' in el,
            pluginCSSClass,
            pluginName,
            pluginResponse,
            index = 0;

        if (!validElement) {
            log.log('invalid node to wire: ' + el);
            return;
        }

        if (!plugins.length) {
            plugins = self.registeredPlugins();
        }

        pluginName = plugins[index++];


        while(pluginName) {
            pluginCSSClass = self.CSS_PREFIX + pluginName;

            if (el.className.indexOf(pluginCSSClass.substr(1)) > -1) {
                pluginResponse = self._runPlugin(el, pluginName);
                dfd.notify(pluginName, pluginResponse, self);
                log.end(pluginResponse);
            }
            pluginName = plugins[index++];
        }

        dfd.resolve();
    }, 0);
    return dfd.promise();
};

/**
 * @function Dorsal._detachPlugin
 * @param {DomNode} el DomNode to unwire
 * @param {String} pluginName plugin to unwire from  the given node.
 * @param {Boolean} hasActuallyDestroyed the unwire status
 * @private
 */
DorsalCore.prototype._detachPlugin = function(el, pluginName) {
    var remainingPlugins,
        hasActuallyDestroyed = false;

    if (typeof el.getAttribute(this.DATA_DORSAL_WIRED) !== 'string') {
        return false;
    }

    if (el.getAttribute(this.DATA_DORSAL_WIRED).indexOf(pluginName) > -1 &&
        this.plugins[pluginName].destroy) {

        this.plugins[pluginName].destroy({
            el: el,
            data: this._getAttributes(el),
            instance: this.ELEMENT_TO_PLUGINS_MAP
                [el.getAttribute(DorsalCore.prototype.GUID_KEY)]
                [pluginName]
        });

        hasActuallyDestroyed = true;
    }

    // remove plugin
    remainingPlugins = el.getAttribute(this.DATA_DORSAL_WIRED).split(' ');
    // remove 1 instance, at the index where the plugin name exists
    remainingPlugins.splice(arrayIndexOf(remainingPlugins, pluginName), 1);
    el.setAttribute(this.DATA_DORSAL_WIRED, remainingPlugins.join(' '));

    return hasActuallyDestroyed;
};

/**
 * @function Dorsal.unwire
 * @description will remove a given el/pluginName
 * @param {DomNode} el node already wired.
 * @param {String} pluginName plugin Name to uwire.
 * @return {Boolean} true if a plugin was detached, false otherwise
 */
DorsalCore.prototype.unwire = function(el, pluginName) {
    // detach a single plugin
    if (pluginName) {
        return this._detachPlugin(el, pluginName);
    }

    var attachedPlugins = el.getAttribute(this.DATA_DORSAL_WIRED).split(' '),
        attachedPluginsCount = attachedPlugins.length,
        hasADetachedPlugin = false,
        iPluginKey,
        i = 0;

    for (; i < attachedPluginsCount; i++) {
        iPluginKey = attachedPlugins[i];

        if (this._detachPlugin(el, iPluginKey)) {
            hasADetachedPlugin =  true;
        }
    }

    return hasADetachedPlugin;
};

/**
 * @function Dorsal.wire
 * @description wire node/nodes
 * wire can be used as follow:<br>
 *
 *  - 0 argument: Will wire each element having the prefix on them.<br>
 *  - 1 argument (node): Will wire all the children elements from a given node.<br>
 *  - 1 argument (Array): Will wire all the elements from a given Collection.<br>
 *  - 2 argument (DomNode, PluginName): Will wire the node/plugin respectively.<br>
 *
 * Wire will not accept an explicitly `undefined` or falsy `el` argument.
 *
 * @param {DomNode|DomNode[]} el a given element or Array to wire
 * @param {String} pluginName plugin name to wire
 * @return {Promise} deferred async wiring of dorsal
 */
DorsalCore.prototype.wire = function(el, pluginName) {
    var deferred = new DorsalDeferred(this.ELEMENT_TO_PLUGINS_MAP),
        responses = [],
        action;

    if (arguments.length && !el) {
        // Bail out if we received a falsy el argument
        return deferred.resolve().promise();
    }

    switch(arguments.length) {
        case 1:
            // if el is Array we wire those given elements
            // otherwise we query elements inside the given element
            if (isDOM(el) || isHTMLElement(el)) {
                responses = this._wireElementsFrom(el);
            } else {
                responses = this._wireElements(el, []);
            }
            break;
        case 2:
            // wiring element/plugin respectively.
            if (isDOM(el)) {
                action = '_wireElementsFrom';
            } else {
                action = isHTMLElement(el) ? '_wireElement' : '_wireElements';
            }

            responses = this[action](el, [pluginName]);
            break;
        default:
            // without arguments, we define document as our parentElement
            responses = this._wireElementsFrom(document);
            break;
    }

    return deferred.when(responses);
};

/**
 * @function Dorsal.rewire
 * @description will remove and re initialize a given node/plugin
 * @param {DomNode} el node to rewire
 * @param {stirng} pluginName plugin Name
 * @return {Promise} deferred async wiring of dorsal
 */
DorsalCore.prototype.rewire = function(el, pluginName) {
    var deferred;

    this.unwire(el, pluginName);

    if (!pluginName) {
        el  = [el];

        deferred = this.wire(el);
    } else {
        deferred = this.wire(el, pluginName);
    }

    return deferred;
};

/**
 * @function Dorsal.get
 * @description will return instances wired to a given node/s
 * @param {DomNode[]} nodes nodes given
 * @return {Array} all object instances stored for given node/s
 */
DorsalCore.prototype.get = function(nodes) {
    var instances = [],
        instance,
        i = 0,
        node;

    if (isHTMLElement(nodes)) {
        nodes = [nodes];
    }

    node = nodes[i++];

    while(node) {
        instance = this._instancesFor(node);
        if (instance) {
            instances.push(instance);
        }

        node = nodes[i++];
    }

    return instances;
};

/**
 * @function Dorsal._instancesFor
 * @param {DomNode} el Node given
 * @return {Object} all stored instances for a particular node
 * @private
*/

DorsalCore.prototype._instancesFor = function(el) {

    var elementGUID = isHTMLElement(el) ?
            el.getAttribute(this.GUID_KEY)
            : el;

    return this.ELEMENT_TO_PLUGINS_MAP[elementGUID];
};

var Dorsal = new DorsalCore();

Dorsal.create = function() {
    return new DorsalCore();
};

DorsalDeferred = function(instances) {
    var status = 'pending',
        doneFns = [],
        failFns = [],
        progressFns = [],
        dfd = this,
        promise;

    promise = {
        state: function() {
            return dfd.state();
        },
        done: function(fn) {
            if (status === 'resolved') {
                fn.call(dfd, instances);
            }

            doneFns.push(fn);

            return dfd.promise();
        },
        fail: function(fn) {
            if (status === 'rejected') {
                fn.call(dfd, instances);
            }

            failFns.push(fn);

            return dfd.promise();
        },
        progress: function(fn) {
            progressFns.push(fn);

            return dfd;
        }
    };

    dfd.state = function() {
        return status;
    };

    dfd.notify = function() {
        var i,
            length = progressFns.length;

        for (i = 0; i < length; i++) {
            progressFns[i].apply(dfd, arguments);
        }
    };

    dfd.reject = function() {
        var i,
            length = failFns.length;

        status = 'rejected';

        for (i = 0; i < length; i++) {
            failFns[i].call(dfd, instances);
        }

        return dfd;
    };

    dfd.resolve = function() {
        var i,
            length = doneFns.length;

        status = 'resolved';

        for (i = 0; i < length; i++) {
            doneFns[i].call(dfd, instances);
        }

        return dfd;
    };

    dfd.promise = function() {
        return promise;
    };

    dfd.when = function(promises) {
        var i = 0,
            completed = 0,
            length = promises && promises.length ? promises.length : 0,
            internalDfd = new DorsalDeferred(instances);

        function promiseDone() {
            completed++;

            if (completed >= length) {
                internalDfd.resolve();
            }
        }

        function promiseProgress() {
            internalDfd.notify(dfd, arguments);
        }
        for (; i < length; i++) {
            promises[i].done(promiseDone)
                .fail(promiseDone)
                .progress(promiseProgress);
        }

        if (!length) {
            internalDfd.resolve();
        }

    return internalDfd.promise();
    };
};

DorsalHistoryLog = {};

DorsalLog = function(status) {
    'use strict';

    var status = status || false,
        available = console && console.log,
        groups = DorsalHistoryLog,
        log = this;

    var timers = function(guid, timeEnd) {

        if (!status) {
            return;
        }

        var action = timeEnd ? 'timeEnd' : 'time';

        if (console[action]) {
            console[action](guid);
        }
    };

    var render = function(guid) {
        window.setTimeout(function() {

            var i = 0,
                messages = groups[guid] || [];

            if (!messages.length) {
                return;
            }

            console.group(guid);

            var msg = messages[i++];

            while(msg) {
                console[msg.msgType || 'log'](
                    msg.time,
                    'message:',
                    msg.msg,
                    'pluginName:',
                    msg.pluginName
                );
                msg = messages[i++];
            }

            console.groupEnd();
            delete groups[guid];

        }, 0);
    };

    var msg = function(message, msgType, options) {
        if (!status) {
            return;
        }

        var options = options || {},
            guid = options.guid;

        if (guid) {

           timers(guid);

           if (!groups[guid]) {
               groups[guid] = [];
           }

           groups[guid].push({
               msg: message,
               time: new Date().getTime(),
               pluginName: options.pluginName,
               msgType: msgType
           });

        } else {
            if (console && console[msgType]) {
                console[msgType](message);
            }
        }
    };

    log.active = function() {
        return status;
    };

    log.end = function(guid) {
        timers(guid, true);

        render(guid);
    };

    log.log = function(message, options) {
        msg(message, 'log', options);
    };

    log.warn = function(message, options) {
        msg(message, 'warn', options);
    };

    log.info = function(message, options) {
        msg(message, 'info', options);
    };

    return log;
};


return Dorsal;

}));
