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

 describe("DorsalJS", function() {
    beforeEach(function() {
        this.dorsal = new DorsalCore();
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        this.clock.restore();
    });

    it('initializes without any plugin state', function() {
        expect(this.dorsal.plugins).toEqual({});
    });

    describe('registering plugins', function() {
        beforeEach(function() {
            this.dorsal.registerPlugin('test', function(options) {});
        });

        it('registers a plugin named "test"', function() {
            expect(this.dorsal.plugins.test).toBeDefined();
        });

        describe('unregistering plugins', function() {
            beforeEach(function() {
                this.dorsal.unregisterPlugin('test');
            });

            it('unregisters a plugin named "test"', function() {
                expect(this.dorsal.plugins.test).not.toBeDefined();
            });
        });
    });

    describe('running plugins', function() {
        beforeEach(function() {
            this.dorsal.registerPlugin('test', function(options) {
                options.el.innerHTML = 'hello, world';
            });

            this.html = '<div class="js-d-test"></div>';

            setFixtures(this.html);

            this.dorsalDoneStub = sinon.stub();
            this.dorsalProgressStub = sinon.stub();

            this.promise = this.dorsal.wire();
            this.promise.done(this.dorsalDoneStub);
            this.promise.progress(this.dorsalProgressStub);

            this.clock.tick(10);
        });

        it('runs the test plugin', function() {
            expect($('.js-d-test')).toHaveHtml('hello, world');
        });

        it('triggers a progress notify function per plugin', function() {
            expect(this.dorsalProgressStub).toHaveBeenCalledOnce();
        });

        it('resolves the promise when complete', function() {
            expect(this.promise.state()).toBe('resolved');
        });

        it('triggers deferred done function when complete', function() {
            expect(this.dorsalDoneStub).toHaveBeenCalledOnce();
        });

        it('triggers deferred done with the wired instances', function() {
            var $el = $('.js-d-test'),
                guid = $el.attr('dorsal-guid'),
                calledWith = this.dorsalDoneStub.args[0][0];

            expect(guid in calledWith).toBeTruthy();
        });

        describe('after initial wire with 2 elements', function() {

            beforeEach(function() {
                this.$el1 = $(this.html);
                this.$el2 = $(this.html);
                this.dorsal.wire([this.$el1.get(0), this.$el2.get(0)]);
                this.clock.tick(10);
            });

            it('runs the test plugin on a DOM node', function() {
                expect(this.$el1).toHaveHtml('hello, world');
            });

            it('has a dorsal guid', function() {
                expect(this.$el2.attr('dorsal-guid')).toBeTruthy();
            });

        });
        describe('after initial wire', function() {

            beforeEach(function() {
                this.$el = $(this.html);
                this.dorsal.wire(this.$el);
                this.clock.tick(10);
            });

            it('runs the test plugin on a DOM node', function() {
                expect(this.$el).toHaveHtml('hello, world');
            });

            it('has a dorsal guid', function() {
                expect(this.$el.attr('dorsal-guid')).toBeTruthy();
            });

        });

        describe('when wiring a falsy element', function() {
            it('does not crash on wire', function () {
                var that = this;
                expect(function () {
                    that.dorsal.wire(undefined);
                }).not.toThrow();
            });

            it('returns a resolved promise on wire', function() {
                var promise = this.dorsal.wire(undefined);
                expect(promise.state()).toBe('resolved');
            });
        });
    });

    describe('without plugins registered', function () {

        it('does not crash when retrieving registered plugins', function () {
            var that = this;
            expect(function() {
                that.dorsal.registeredPlugins();
            }).not.toThrow();
        });

        it('does not crash on wire', function () {
            var that = this;
            expect(function () {
                that.dorsal.wire();
            }).not.toThrow();
        });

        it('resolves the promise on wire', function () {
            expect(this.dorsal.wire().state()).toBe('resolved');
        });
    });

    describe('data attributes', function() {

        beforeEach(function() {
            this.dorsal.registerPlugin('test', function(options) {
                options.el.innerHTML = options.data.testOneYay + ', ' + options.data.testTwoYay;
            });

            this.html = '<div class="js-d-test" data-d-test-one-yay="hello" data-d-test-two-yay="world"></div>';
            setFixtures(this.html);
            this.dorsal.wire();
            this.clock.tick(10);
        });

        it('gets data attributes without dataset', function() {
            expect($('.js-d-test')).toHaveHtml('hello, world');
        });

        it('gets attributes in older browsers', function() {
            var attributes = this.dorsal._getDataAttributes($(this.html).get(0));
            expect(attributes.testOneYay).toBe('hello');
            expect(attributes.testTwoYay).toBe('world');
        });

        // note this test will actually fail in older browsers
        it('gets attributes in newer browsers', function() {
            var attributes = this.dorsal._getDatasetAttributes($(this.html).get(0));
            expect(attributes.testOneYay).toBe('hello');
            expect(attributes.testTwoYay).toBe('world');
        });

        it('marks element as wired', function() {
            expect($('.js-d-test').data('xdWired')).toContain('test');
        });

    });

    describe('element lifecycle', function() {

        beforeEach(function() {
            var helloReturnedObject = {id: 'hello'},
                self = this;

            this.isReturnedObject = false;

            this.dorsal.registerPlugin('hello', {
                create: function(options) {
                    options.el.innerHTML = options.el.innerHTML + options.data.h;

                    return helloReturnedObject;
                },
                destroy: function(options) {
                    self.isReturnedObject = options.instance.id === helloReturnedObject.id;
                }
            });

            this.dorsal.registerPlugin('world', {
                create: function(options) {
                    options.el.innerHTML = options.el.innerHTML + options.data.w;
                },
                destroy: function(options) {
                    self.worldData = options.data;
                }
            });

            this.$html = $('<div class="js-d-hello js-d-world" data-d-h="hello" data-d-w="world"></div>');
            this.dorsal.wire(this.$html);
            this.clock.tick(10);
        });

        it('does not explode when unwiring an unwired element', function() {
            expect(this.dorsal.unwire($('<div>').get(0), 'pizza')).toBeFalsy();
        });

        it('attaches multiple plugins to an element', function() {
            expect(this.$html.data('xdWired').indexOf('hello') > -1).toBeTruthy();
            expect(this.$html.data('xdWired').indexOf('world') > -1).toBeTruthy();
        });

        it('does not allow wiring previously wired plugins', function() {
            this.dorsal.wire(this.$html.get(0), 'hello');
            expect(this.$html.data('xdWired').match(/hello/g).length).toBe(1);
            expect(this.$html.text().match(/hello/g).length).toBe(1);
        });

        describe('unwire all plugins', function() {

            beforeEach(function() {
                this.dorsal.unwire(this.$html.get(0));
            });

            it('removes just the hello and world plugins', function() {
                expect(this.$html.data('xdWired').indexOf('hello') === -1).toBeTruthy();
                expect(this.$html.data('xdWired').indexOf('world') === -1).toBeTruthy();
            });

            it('passes the returned value from create into destroy', function() {
                expect(this.isReturnedObject).toBeTruthy();
            });

            it('passes data to destroy', function() {
                expect(this.worldData.w).toBe('world');
            });

        });

        describe('unwire just the hello plugin', function() {

            beforeEach(function() {
                this.dorsal.unwire(this.$html.get(0));
            });

            it('removes just the hello plugin', function() {
                expect(this.$html.data('xdWired').indexOf('hello') === -1).toBeTruthy();
                expect(this.$html.data('xdWired').indexOf('world') === -1).toBeTruthy();
            });

            it('passes the returned value from create into destroy', function() {
                expect(this.isReturnedObject).toBeTruthy();
            });

            it('passes data to destroy', function() {
                expect(this.worldData.w).toBe('world');
            });

        });

        describe('returning instances wired to several elements', function() {

            beforeEach(function() {

                this.$html = $('<div class="js-d-hello"></div>');
                this.$other = $('<div class="js-d-replace"></div>');
                this.dorsal.registerPlugin('replace', {
                    create: function(options) {
                       var $el = $(options.el),
                           addContent = 'some content';

                        $el.text(addContent);

                        return { content: addContent };
                    },
                    destroy: function(options) {

                        options.el.textContent = '';
                    }
                });

                this.dorsal.wire(this.$html);
                this.dorsal.wire(this.$other);

                this.clock.tick(10);
            });

            it('should return all the wired instances in given elements', function() {

                var instances = this.dorsal.get([this.$html.get(0), this.$other.get(0)]);

                expect(instances.length).toBe(2);
                expect(instances[1].replace.content === 'some content').toBeTruthy();
            });

        });

        describe('returning instances wired to a given element', function() {

            beforeEach(function() {

                this.$html = $('<div class="js-d-replace js-d-hello"></div>');

                this.dorsal.registerPlugin('replace', {
                    create: function(options) {
                       var $el = $(options.el),
                           addContent = 'some content';

                        $el.text(addContent);

                        return { content: addContent };
                    },
                    destroy: function(options) {

                        options.el.textContent = '';
                    }
                });

                this.dorsal.wire(this.$html);

                this.clock.tick(10);
            });

            it('should return all the wired instances in by element', function() {

                var instances = this.dorsal._instancesFor(this.$html.get(0));

                expect(Object.keys(instances).length).toBe(2);
                expect(instances.replace.content === 'some content').toBeTruthy();
            });

            it('should return all the wired instances in by guid', function() {

                var guid = this.$html.attr('dorsal-guid');
                var instances = this.dorsal._instancesFor(guid);

                expect(Object.keys(instances).length).toBe(2);
                expect(instances.replace.content === 'some content').toBeTruthy();
            });
        });

        describe('wiring just the pizza plugin', function() {

            beforeEach(function() {
                this.dorsal.registerPlugin('pizza', function() {});
                this.dorsal.registerPlugin('hotdog', function() {});

                this.$html.addClass('js-d-pizza js-d-hotdog');

                this.dorsal.wire(this.$html.get(0), 'pizza');
                this.clock.tick(10);
            });

            it('runs wire just for pizza', function() {
                expect(this.$html.data('xdWired').indexOf('pizza') !== -1).toBeTruthy();
                expect(this.$html.data('xdWired').indexOf('hotdog') === -1).toBeTruthy();
            });

        });

        describe('rewire', function() {

            beforeEach(function() {
                this.promise = this.dorsal.rewire(this.$html.get(0));
                this.clock.tick(10);
            });

            it('runs unwire', function() {
                expect(this.isReturnedObject).toBeTruthy();
            });

            it('runs wire', function() {
                // destroy doesn't remove hello, this proves hello was run again
                expect(this.$html.text().match(/hello/g).length).toBe(2);
            });

            it('keeps hello and world in wired attribute', function() {
                expect(this.$html.data('xdWired').indexOf('hello') > -1).toBeTruthy();
                expect(this.$html.data('xdWired').indexOf('world') > -1).toBeTruthy();
            });

            it('returns a deferred promise', function() {
                expect(this.promise.state()).toBe('resolved');
            });

        });

    });

});
