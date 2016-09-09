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
