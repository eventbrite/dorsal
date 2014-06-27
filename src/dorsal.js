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

var DorsalCore = function() {};

DorsalCore.prototype.VERSION = '0.3.2';
DorsalCore.prototype.CSS_PREFIX = '.js-d-';
DorsalCore.prototype.DATA_PREFIX = 'd';

DorsalCore.prototype.registerPlugin = function(pluginName, callback) {
    if (!this.plugins) {
        this.plugins = {};
    }
    this.plugins[pluginName] = callback;
};

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

DorsalCore.prototype._getAttributes = function(el) {
    if (el.dataset) {
        return this._getDatasetAttributes(el);
    }

    return this._getDataAttributes(el);
};

DorsalCore.prototype._runPlugin = function(plugin, el) {
    var data = this._getAttributes(el);
    plugin.call(el, {
        el: el,
        data: data
    });
};

DorsalCore.prototype._wirePlugin = function(plugin, el) {
    var self = this;
    window.setTimeout(function() {
        var pluginCSSClass = self.CSS_PREFIX + plugin,
            elements = el.querySelectorAll(pluginCSSClass);

        if (el !== document && el.className.indexOf(pluginCSSClass.substr(1)) > -1) {
            self._runPlugin(self.plugins[plugin], el);
        }

        for (var elementIndex = 0, element; (element = elements[elementIndex]); elementIndex++) {
            self._runPlugin(self.plugins[plugin], element);
        }
    }, 0);
}

DorsalCore.prototype.wire = function(el) {
    if (!this.plugins) {
        throw new Error('No plugins registered with Dorsal');
    }

    var pluginKeys = Object.keys(this.plugins),
        index = 0,
        length = pluginKeys.length,
        el = el || document;

    for (; index < length; index++) {
        this._wirePlugin(pluginKeys[index], el);
    }
};

var Dorsal = new DorsalCore();

Dorsal.create = function() {
    return new DorsalCore();
};
