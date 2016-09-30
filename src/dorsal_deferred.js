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
