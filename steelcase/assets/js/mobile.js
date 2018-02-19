/*
 * Mobile's Front-end Library
 */

(function($, window, document, undefined) {
    'use strict';

    // Enable FastClick if present

    $(function() {
        if (typeof FastClick !== 'undefined') {
            // Don't attach to body if undefined
            if (typeof document.body !== 'undefined') {
                FastClick.attach(document.body);
            }
        }
    });

    /*
     * jquery.requestAnimationFrame
     * https://github.com/gnarf37/jquery-requestAnimationFrame
     * Requires jQuery 1.8+
     *
     * Copyright (c) 2012 Corey Frang
     * Licensed under the MIT license.
     */

    (function(jQuery) {


        // requestAnimationFrame polyfill adapted from Erik Möller
        // fixes from Paul Irish and Tino Zijdel
        // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

        var animating,
            lastTime = 0,
            vendors = ['webkit'],
            requestAnimationFrame = window.requestAnimationFrame,
            cancelAnimationFrame = window.cancelAnimationFrame,
            jqueryFxAvailable = 'undefined' !== typeof jQuery.fx;

        for (; lastTime < vendors.length && !requestAnimationFrame; lastTime++) {
            requestAnimationFrame = window[vendors[lastTime] + 'RequestAnimationFrame'];
            cancelAnimationFrame = cancelAnimationFrame ||
                window[vendors[lastTime] + 'CancelAnimationFrame'] ||
                window[vendors[lastTime] + 'CancelRequestAnimationFrame'];
        }

        function raf() {
            if (animating) {
                requestAnimationFrame(raf);

                if (jqueryFxAvailable) {
                    jQuery.fx.tick();
                }
            }
        }

        if (requestAnimationFrame) {
            // use rAF
            window.requestAnimationFrame = requestAnimationFrame;
            window.cancelAnimationFrame = cancelAnimationFrame;

            if (jqueryFxAvailable) {
                jQuery.fx.timer = function(timer) {
                    if (timer() && jQuery.timers.push(timer) && !animating) {
                        animating = true;
                        raf();
                    }
                };

                jQuery.fx.stop = function() {
                    animating = false;
                };
            }
        } else {
            // polyfill
            window.requestAnimationFrame = function(callback) {
                var currTime = new Date().getTime(),
                    timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                    id = window.setTimeout(function() {
                        callback(currTime + timeToCall);
                    }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };

        }

    }($));

    /*
     * Custom the Mobile Core functions
    */

    var header_helpers = function(class_array) {
        var head = $('head');

        head.prepend($.map(class_array, function(class_name) {
            if (head.has('.' + class_name).length === 0) {
                return '<meta class="' + class_name + '" />';
            }
        }));
    };

    header_helpers([
        'mobile-mq-small',
        'mobile-mq-small-only',
        'mobile-mq-medium',
        'mobile-mq-medium-only'
    ]);

    var trim = function(str) {
        if (typeof str === 'string') {
            return str.trim();
        }
        return str;
    };

    // Event binding and data-options updating.

    var bindings = function(method, options) {
        var self = this,
            config = ($.isArray(options) ? options[0] : options) || method,
            bind = function() {
                var $this = $(this),
                    should_bind_events = !$this.data(self.name + '-init');
                $this.data(self.name + '-init', $.extend(true, {}, self.settings, config, self.data_options($this)));

                if (should_bind_events) {
                    self.events(this);
                }
            };

        if ($(this.scope).is('[data-' + this.name + ']')) {
            bind.call(this.scope);
        } else {
            $('[data-' + this.name + ']', this.scope).each(bind);
        }
        // # Patch to fix #5043 to move this *after* the if/else clause in order for Backbone and similar frameworks to have improved control over event binding and data-options updating.
        if (typeof method === 'string') {
            if($.isArray(options)) return this[method].apply(this, options);
            else return this[method].call(this, options);
        }

    };

    var single_image_loaded = function(image, callback) {
        function loaded() {
            callback(image[0]);
        }

        function bindLoad() {
            this.one('load', loaded);
        }

        if (!image.attr('src')) {
            loaded();
            return;
        }

        if (image[0].complete || image[0].readyState === 4) {
            loaded();
        } else {
            bindLoad.call(image);
        }
    };

    function removeQuotes(string) {
        if (typeof string === 'string' || string instanceof String) {
            string = string.replace(/^['\\/"]+|(;\s?})+|['\\/"]+$/g, '');
        }

        return string;
    }

    function MediaQuery(selector) {
        this.selector = selector;
        this.query = '';
    }

    MediaQuery.prototype.toString = function() {
        return this.query = this.query || $(this.selector).css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, '');
    };

    window.Mobile = {
        name: 'Mobile',

        media_queries: {
            'small': new MediaQuery('.mobile-mq-small'),
            'small-only': new MediaQuery('.mobile-mq-small-only'),
            'medium': new MediaQuery('.mobile-mq-medium'),
            'medium-only': new MediaQuery('.mobile-mq-medium-only')
        },

        stylesheet: $('<style></style>').appendTo('head')[0].sheet,

        global: {},

        init: function(scope, libraries, method, options, response) {
            var args = [scope, method, options, response],
                responses = [];

            // set mobile global scope
            this.scope = scope || this.scope;

            if (libraries && typeof libraries === 'string' && !/reflow/i.test(libraries)) {
                if (this.libs.hasOwnProperty(libraries)) {
                    responses.push(this.init_lib(libraries, args));
                }
            } else {
                for (var lib in this.libs) {
                    responses.push(this.init_lib(lib, libraries));
                }
            }

            // $(window).load(function() {
            //     $(window)
            //         .trigger('resize.imagesbox')
            //         .trigger('resize.dropdown')
            //         .trigger('resize.equalizer')
            //         .trigger('resize.responsive')
            //         .trigger('resize.topbar')
            //         .trigger('resize.slides');
            // });

            return scope;
        },

        init_lib: function(lib, args) {
            if (this.libs.hasOwnProperty(lib)) {
                this.patch(this.libs[lib]);

                if (args && args.hasOwnProperty(lib)) {
                    if (typeof this.libs[lib].settings !== 'undefined') {
                        $.extend(true, this.libs[lib].settings, args[lib]);
                    } else if (typeof this.libs[lib].defaults !== 'undefined') {
                        $.extend(true, this.libs[lib].defaults, args[lib]);
                    }
                    return this.libs[lib].init.apply(this.libs[lib], [this.scope, args[lib]]);
                }

                args = args instanceof Array ? args : new Array(args);
                return this.libs[lib].init.apply(this.libs[lib], args);
            }

            return function() {};
        },

        patch: function(lib) {
            lib.scope = this.scope;
            lib['data_options'] = this.utils.data_options;
            lib['bindings'] = bindings;
            lib['trim'] = trim;
        },

        inherit: function(scope, methods) {
            var methods_arr = methods.split(' '),
                i = methods_arr.length;

            while (i--) {
                if (this.utils.hasOwnProperty(methods_arr[i])) {
                    scope[methods_arr[i]] = this.utils[methods_arr[i]];
                }
            }
        },

        libs: {},

        // methods that can be inherited in libraries
        utils: {

            // Description:
            //    Parses data-options attribute
            //
            // Arguments:
            //    El (jQuery Object): Element to be parsed.
            //
            // Returns:
            //    Options (Javascript Object): Contents of the element's data-options
            //    attribute.
            data_options: function(el, data_attr_name) {
                data_attr_name = data_attr_name || 'options';
                var opts = {},
                    ii, p, opts_arr;

                var cached_options = el.data(data_attr_name);

                if (typeof cached_options === 'object') {
                    return cached_options;
                }

                opts_arr = (cached_options || ':').split(';');
                ii = opts_arr.length;

                function isNumber(o) {
                    return !isNaN(o - 0) && o !== null && o !== '' && o !== false && o !== true;
                }

                while (ii--) {
                    p = opts_arr[ii].split(':');
                    p = [p[0], p.slice(1).join(':')];

                    if (/true/i.test(p[1])) {
                        p[1] = true;
                    }
                    if (/false/i.test(p[1])) {
                        p[1] = false;
                    }
                    if (isNumber(p[1])) {
                        if (p[1].indexOf('.') === -1) {
                            p[1] = parseInt(p[1], 10);
                        } else {
                            p[1] = parseFloat(p[1]);
                        }
                    }

                    if (p.length === 2 && p[0].length > 0) {
                        opts[trim(p[0])] = trim(p[1]);
                    }
                }

                return opts;
            },

            // Description:
            //    Adds JS-recognizable media queries
            //
            // Arguments:
            //    Media (String): Key string for the media query to be stored as in
            //    Mobile.media_queries
            //
            //    Class (String): Class name for the generated <meta> tag
            register_media: function(media, media_class) {
                if (Mobile.media_queries[media] === undefined) {
                    $('head').append('<meta class="' + media_class + '"/>');
                    Mobile.media_queries[media] = removeQuotes($('.' + media_class).css('font-family'));
                }
            },

            // Description:
            //    Add custom CSS within a JS-defined media query
            //
            // Arguments:
            //    Rule (String): CSS rule to be appended to the document.
            //
            //    Media (String): Optional media query string for the CSS rule to be
            //    nested under.
            add_custom_rule: function(rule, media) {
                if (media === undefined && Mobile.stylesheet) {
                    Mobile.stylesheet.insertRule(rule, Mobile.stylesheet.cssRules.length);
                } else {
                    var query = Mobile.media_queries[media];

                    if (query !== undefined) {
                        Mobile.stylesheet.insertRule('@media ' +
                            Mobile.media_queries[media] + '{ ' + rule + ' }', Mobile.stylesheet.cssRules.length);
                    }
                }
            },

            // Description:
            //    Performs a callback function when an image is fully loaded
            //
            // Arguments:
            //    Image (jQuery Object): Image(s) to check if loaded.
            //
            //    Callback (Function): Function to execute when image is fully loaded.
            image_loaded: function(images, callback) {
                var self = this,
                    unloaded = images.length;

                function pictures_has_height(images) {
                    var pictures_number = images.length;

                    for (var i = pictures_number - 1; i >= 0; i--) {
                        if (images.attr('height') === undefined) {
                            return false;
                        }
                    }

                    return true;
                }

                if (unloaded === 0 || pictures_has_height(images)) {
                    callback(images);
                }

                images.each(function() {
                    single_image_loaded($(this), function() {
                        unloaded -= 1;
                        if (unloaded === 0) {
                            callback(images);
                        }
                    });
                });
            },

            // Description:
            //    Returns a random, alphanumeric string
            //
            // Arguments:
            //    Length (Integer): Length of string to be generated. Defaults to random
            //    integer.
            //
            // Returns:
            //    Rand (String): Pseudo-random, alphanumeric string.
            random_str: function() {
                if (!this.fidx) {
                    this.fidx = 0;
                }
                this.prefix = this.prefix || [(this.name || 'M'), (+new Date).toString(36)].join('-');

                return this.prefix + (this.fidx++).toString(36);
            },

            // Description:
            //    Helper for window.matchMedia
            //
            // Arguments:
            //    mq (String): Media query
            //
            // Returns:
            //    (Boolean): Whether the media query passes or not
            match: function(mq) {
                return window.matchMedia(mq).matches;
            },

            // Description:
            //    Helpers for checking Mobile default media queries with JS
            //
            // Returns:
            //    (Boolean): Whether the media query passes or not

            is_small_up: function() {
                return this.match(Mobile.media_queries.small);
            },

            is_medium_up: function() {
                return this.match(Mobile.media_queries.medium);
            },

            is_small_only: function() {
                return !this.is_medium_up();
            },

            is_medium_only: function() {
                return this.is_medium_up();
            }
        }
    };

    $.fn.mobile = function() {
        var args = Array.prototype.slice.call(arguments, 0);

        return this.each(function() {
            Mobile.init.apply(Mobile, [this].concat(args));
            return this;
        });
    };

}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.accordion = {
        name: 'accordion',

        settings: {
            content_class: 'content',
            active_class: 'active',
            multi_expand: false,
            toggleable: true,
            callback: function() {}
        },

        init: function(scope, method, options) {
            this.bindings(method, options);
        },

        events: function(instance) {
            var self = this;
            this.create($(instance));

            $(this.scope)
                .off('.' + this.name)
                .on('click.' + this.name, '[data-' + this.name + '] > .item > a', function(e) {
                    e.preventDefault();

                    var container = $(this).closest('[data-' + self.name + ']'),
                        groupSelector = 'data-' + self.name + '=' + container.data(self.name),
                        settings = container.data(self.name + '-init') || self.settings,
                        // target = $('#' + this.href.split('#')[1]).parent(),
                        contentAttr = $(this).context.attributes['data-content'],
                        target = $('#' + (contentAttr ? contentAttr.value : this.href.split('#')[1])).parent(),
                        items = $('> .item', container),
                        active_item;

                    if (container.data(self.name)) {
                        items = items.add('[' + groupSelector + '] > .item');
                    }
                    active_item = items.filter('.' + settings.active_class);

                    if (settings.toggleable && target.hasClass(settings.active_class)) {
                        target.toggleClass(settings.active_class, false);
                        $(this).attr('aria-expanded', function(i, attr) {
                            return attr === 'true' ? 'false' : 'true';
                        });
                        settings.callback(target);
                        target.triggerHandler('toggled', [container]);
                        container.triggerHandler('toggled', [target]);
                        return;
                    }

                    if (!settings.multi_expand) {
                        active_item
                            .removeClass(settings.active_class)
                            .children('a')
                            .attr('aria-expanded', 'false');
                    }

                    target.addClass(settings.active_class);
                    $(this).attr('aria-expanded', 'true');
                    settings.callback(target);
                    target.triggerHandler('toggled', [container]);
                    container.triggerHandler('toggled', [target]);
                });
        },

        create: function(container) {
            var items = $('> .item', container),
                settings = container.data(this.name + '-init') || this.settings;

            items
                .children('a')
                .attr('aria-expanded', 'false')
                .end()
                .filter('.' + settings.active_class).children('a')
                .attr('aria-expanded', 'true');

            if (settings.multi_expand) {
                container.attr('aria-multiselectable', 'true');
            }
        },

        off: function() {},

        reflow: function() {}
    };
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.alert = {
        name: 'alert',

        settings: {
            callback: function() {}
        },

        init: function(scope, method, options) {
            this.bindings(method, options);
        },

        events: function() {
            var self = this;

            $(this.scope).off('.' + this.name).on('click.' + this.name, '[data-' + this.name + '] .close', function(e) {
                var container = $(this).closest('[data-' + self.name + ']'),
                    settings = container.data(self.name + '-init') || self.settings;

                e.preventDefault();

                container
                    .addClass(this.name + '-close')
                    .on('transitionend webkitTransitionEnd', function(e) {
                        $(this).trigger('close.' + this.name).remove();
                        settings.callback();
                    });
            });
        },

        reflow: function() {}
    };
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.dropdown = {
        name: 'dropdown',

        settings: {
            active_class: 'open',
            disabled_class: 'disabled',
            mega_class: 'mega',
            align: 'bottom',
            no_pip: false,
            opened: function() {},
            closed: function() {}
        },

        init: function(scope, method, options) {
            this.data_attr = 'data-' + this.name;
            $.extend(true, this.settings, method, options);
            this.bindings(method, options);
        },

        events: function(scope) {
            var self = this;

            $(this.scope)
                .off('.' + this.name)
                .on('click.' + this.name, '[' + this.data_attr + ']', function(e) {
                    var settings = $(this).data(self.name + '-init') || self.settings;
                    if ('ontouchstart' in document) {
                        e.preventDefault();
                        if ($(this).parent('[data-modal-id]').length) {
                            e.stopPropagation();
                        }
                        self.toggle($(this));
                    }
                })
                .on('click.' + this.name, function(e) {
                    var parent = $(e.target).closest('[' + self.data_attr + '-content]');
                    var links = parent.find('a');

                    if (links.length > 0 && parent.attr('aria-autoclose') !== 'false') {
                        self.close.call(self, $('[' + self.data_attr + '-content]'));
                    }

                    if (e.target !== document && !$.contains(document.documentElement, e.target)) {
                        return;
                    }

                    if ($(e.target).closest('[' + self.data_attr + ']').length > 0) {
                        return;
                    }

                    if (!($(e.target).data('modalId')) &&
                        (parent.length > 0 && ($(e.target).is('[' + self.data_attr + '-content]') ||
                            $.contains(parent.first()[0], e.target)))) {
                        e.stopPropagation();
                        return;
                    }

                    self.close.call(self, $('[' + self.data_attr + '-content]'));
                })
                .on('opened.' + this.name, '[' + this.data_attr + '-content]', function() {
                    self.settings.opened.call(this);
                })
                .on('closed.' + this.name, '[' + this.data_attr + '-content]', function() {
                    self.settings.closed.call(this);
                });

            $(window)
                .off('.' + this.name)
                .on('resize.' + this.name, function() {
                    self.resize.call(self);
                });

            this.resize();
        },

        close: function(dropdown) {
            var self = this;
            dropdown.each(function(idx) {
                var original_target = $('[' + self.data_attr + '=' + dropdown[idx].id + ']') || $('aria-controls=' + dropdown[idx].id + ']');
                original_target.attr('aria-expanded', 'false');
                if ($(this).hasClass(self.settings.active_class)) {
                    $(this)
                        .css('left', '-99999px')
                        .attr('aria-hidden', 'true')
                        .removeClass(self.settings.active_class)
                        .prev('[' + self.data_attr + ']')
                        .removeClass(self.settings.active_class)
                        .removeData('target');

                    $(this).trigger('closed.' + self.name, [dropdown]);
                }
            });
            dropdown.removeClass('act-open-' + this.name);
        },

        closeall: function() {
            var self = this;
            $.each($('.act-open-' + this.name), function() {
                self.close.call(self, $(this));
            });
        },

        open: function(dropdown, target) {
            this.css(dropdown.addClass(this.settings.active_class), target);
            dropdown.prev('[' + this.data_attr + ']').addClass(this.settings.active_class);
            dropdown.data('target', target.get(0)).trigger('opened.dropdown', [dropdown, target]);
            dropdown.attr('aria-hidden', 'false');
            target.attr('aria-expanded', 'true');
            dropdown.focus();
            dropdown.addClass('act-open-' + this.name);
        },

        toggle: function(target) {
            if (target.hasClass(this.settings.disabled_class)) {
                return;
            }
            var dropdown = $('#' + target.data(this.name));
            if (dropdown.length === 0) {
                return;
            }

            this.close.call(this, $('[' + this.data_attr + '-content]').not(dropdown));

            if (dropdown.hasClass(this.settings.active_class)) {
                this.close.call(this, dropdown);
                if (dropdown.data('target') !== target.get(0)) {
                    this.open.call(this, dropdown, target);
                }
            } else {
                this.open.call(this, dropdown, target);
            }
        },

        resize: function() {
            var dropdown = $('[' + this.data_attr + '-content].open');
            var target = $(dropdown.data('target'));

            if (dropdown.length && target.length) {
                this.css(dropdown, target);
            }
        },

        css: function(dropdown, target) {
            var left_offset = Math.max((target.width() - dropdown.width()) / 2, 8),
                settings = target.data(this.name + '-init') || this.settings;

            this.clear_idx();

            this.style(dropdown, target, settings);

            return dropdown;
        },

        style: function(dropdown, target, settings) {
            var css = $.extend({}, this.dirs[settings.align].call(dropdown, target, settings));

            dropdown.attr('style', '').css(css);
        },

        // return CSS property object
        // `this` is the dropdown
        dirs: {
            // Calculate target offset
            _base: function(t, s) {
                var o_p = this.offsetParent(),
                    o = o_p.offset(),
                    p = t.offset();

                p.top -= o.top;
                p.left -= o.left;

                //set some flags on the p object to pass along
                p.missRight = false;
                p.missTop = false;
                p.missLeft = false;
                p.leftRightFlag = false;

                //lets see if the panel will be off the screen
                //get the actual width of the page and store it
                var actualBodyWidth,
                    windowWidth = window.innerWidth;

                if (document.querySelector('.row')) {
                    actualBodyWidth = document.querySelector('.row').clientWidth;
                } else {
                    actualBodyWidth = windowWidth;
                }

                var actualMarginWidth = (windowWidth - actualBodyWidth) / 2;
                var actualBoundary = actualBodyWidth;

                if (!this.hasClass('mega') && !s.ignore_repositioning) {
                    var outerWidth = this.outerWidth();
                    var o_left = t.offset().left;

                    //miss top
                    if (t.offset().top <= this.outerHeight()) {
                        p.missTop = true;
                        actualBoundary = windowWidth - actualMarginWidth;
                        p.leftRightFlag = true;
                    }

                    //miss right
                    if (o_left + outerWidth > o_left + actualMarginWidth && o_left - actualMarginWidth > outerWidth) {
                        p.missRight = true;
                        p.missLeft = false;
                    }

                    //miss left
                    if (o_left - outerWidth <= 0) {
                        p.missLeft = true;
                        p.missRight = false;
                    }
                }

                return p;
            },

            top: function(t, s) {
                var self = Mobile.libs.dropdown,
                    p = self.dirs._base.call(this, t, s);

                this.removeClass('drop-left drop-right').addClass('drop-top');

                if (p.missTop == true) {
                    p.top = p.top + t.outerHeight() + this.outerHeight();
                    this.removeClass('drop-top');
                }

                if (p.missRight == true) {
                    p.left = p.left - this.outerWidth() + t.outerWidth();
                }

                if (!self.settings.no_pip && t.outerWidth() < this.outerWidth() || this.hasClass(s.mega_menu)) {
                    self.adjust_pip(this, t, s, p);
                }

                return {
                    left: p.left,
                    top: p.top - this.outerHeight()
                };
            },

            bottom: function(t, s) {
                var self = Mobile.libs.dropdown,
                    p = self.dirs._base.call(this, t, s);

                this.removeClass('drop-right drop-top drop-left');

                if (p.missRight == true) {
                    p.left = p.left - this.outerWidth() + t.outerWidth();
                }

                if (t.outerWidth() < this.outerWidth() || this.hasClass(s.mega_menu)) {
                    self.adjust_pip(this, t, s, p);
                }

                return {
                    left: p.left,
                    top: p.top + t.outerHeight()
                };
            },

            left: function(t, s) {
                var p = Mobile.libs.dropdown.dirs._base.call(this, t, s);

                this.removeClass('drop-right drop-top').addClass('drop-left');

                if (p.missLeft == true) {
                    p.left = p.left + this.outerWidth();
                    p.top = p.top + t.outerHeight();
                    this.removeClass('drop-left');
                }

                return {
                    left: p.left - this.outerWidth(),
                    top: p.top
                };
            },

            right: function(t, s) {
                var self = Mobile.libs.dropdown,
                    p = self.dirs._base.call(this, t, s);

                this.removeClass('drop-left drop-top').addClass('drop-right');

                if (p.missRight == true) {
                    p.left = p.left - this.outerWidth();
                    p.top = p.top + t.outerHeight();
                    this.removeClass('drop-right');
                } else {
                    p.triggeredRight = true;
                }

                if (t.outerWidth() < this.outerWidth() || this.hasClass(s.mega_menu)) {
                    self.adjust_pip(this, t, s, p);
                }

                return {
                    left: p.left + t.outerWidth(),
                    top: p.top
                };
            }
        },

        // Insert rule to style psuedo elements
        adjust_pip: function(dropdown, target, settings, position) {
            var sheet = Mobile.stylesheet,
                pip_offset_base = 8;

            if (settings.no_pip === true) return;
            if (dropdown.hasClass(settings.mega_class)) {
                pip_offset_base = position.left + (target.outerWidth() / 2) - 8;
            }

            this.rule_idx = sheet.cssRules.length;

            //default
            var sel_before = '.dropdown-menu.open::before',
                sel_after = '.dropdown-menu.open::after',
                css_before = 'left: ' + pip_offset_base + 'px;',
                css_after = 'left: ' + (pip_offset_base - 1) + 'px;';

            if (position.missRight == true) {
                pip_offset_base = dropdown.outerWidth() - 23;
                sel_before = '.dropdown-menu.open::before',
                sel_after = '.dropdown-menu.open::after',
                css_before = 'left: ' + pip_offset_base + 'px;',
                css_after = 'left: ' + (pip_offset_base - 1) + 'px;';
            }

            //just a case where right is fired, but its not missing right
            if (position.triggeredRight == true) {
                sel_before = '.dropdown-menu.open::before',
                sel_after = '.dropdown-menu.open::after',
                css_before = 'left:-12px;',
                css_after = 'left:-14px;';
            }

            if (sheet.insertRule) {
                sheet.insertRule([sel_before, '{', css_before, '}'].join(' '), this.rule_idx);
                sheet.insertRule([sel_after, '{', css_after, '}'].join(' '), this.rule_idx + 1);
            } else {
                sheet.addRule(sel_before, css_before, this.rule_idx);
                sheet.addRule(sel_after, css_after, this.rule_idx + 1);
            }
        },

        // Remove old dropdown rule index
        clear_idx: function() {
            var sheet = Mobile.stylesheet;

            if (typeof this.rule_idx !== 'undefined') {
                sheet.deleteRule(this.rule_idx);
                sheet.deleteRule(this.rule_idx);
                delete this.rule_idx;
            }
        },

        off: function() {
            $(this.scope).off('.' + this.name);
            $('html, body').off('.' + this.name);
            $(window).off('.dropdown');
            $('[' + this.data_attr + '-content]').off('.' + this.name);
        },

        reflow: function() {}
    };
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.equalizer = {
        name: 'equalizer',

        settings: {
            use_tallest: true,
            beforeChange: $.noop,
            afterChange: $.noop,
            equalize_on_stack: false,
            act_on_hidden: false
        },

        init: function(scope, method, options) {
            this.bindings(method, options);
            this.reflow();
        },

        events: function() {
            $(window).off('.' + this.name).on('resize.' + this.name, function(e) {
                this.reflow();
            }.bind(this));
        },

        equalize: function(container) {
            var isStacked = false,
                container = $(container),
                group = container.data(this.name),
                settings = container.data(this.name + '-init') || this.settings,
                vals,
                firstTopOffset;

            if (settings.act_on_hidden) {
                vals = group ? container.find('[data-' + this.name + '-watch="' + group + '"]') : container.find('[data-' + this.name + '-watch]');
            } else {
                vals = group ? container.find('[data-' + this.name + '-watch="' + group + '"]:visible') : container.find('[data-' + this.name + '-watch]:visible');
            }

            if (vals.length === 0) {
                return;
            }

            settings.beforeChange();
            container.trigger('beforeChange.' + this.name);
            vals.height('inherit');

            if (settings.equalize_on_stack === false) {
                firstTopOffset = vals.first().offset().top;
                vals.each(function() {
                    if ($(this).offset().top !== firstTopOffset) {
                        isStacked = true;
                        return false;
                    }
                });
                if (isStacked) {
                    return;
                }
            }

            var heights = vals.map(function() {
                return $(this).outerHeight(false);
            }).get();

            if (settings.use_tallest) {
                var max = Math.max.apply(null, heights);
                vals.css('height', max);
            } else {
                var min = Math.min.apply(null, heights);
                vals.css('height', min);
            }

            settings.afterChange();
            container.trigger('afterChange.' + this.name);
        },

        reflow: function() {
            var self = this;

            $('[data-' + this.name + ']', this.scope).each(function() {
                self.equalize(this);
            });
        }
    };
})(jQuery, window, window.document);

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.imagesbox = {
        name: 'imagesbox',

        settings: {
            templates: {
                viewing: [
                    '<a href="javascript:void(0);" class="imagesbox-close">&times;</a>',
                    '<div class="visible-img" style="display: none">',
                    '<div class="imagesbox-touch-label"></div>',
                    '<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" alt="">',
                    '<p class="imagesbox-caption"></p>',
                    '</div>',
                    '<img class="imagesbox-preload-next" style="display: none;" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" alt="next image">',
                    '<img class="imagesbox-preload-prev" style="display: none;" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" alt="previous image">'
                ].join('')
            },

            // comma delimited list of selectors that, on click, will close imagesbox,
            // add 'div.imagesbox-blackout, div.visible-img' to close on background click
            close_selectors: '.imagesbox-close, div.imagesbox-blackout',

            // Default to the entire li element.
            open_selectors: '',

            // Image will be skipped in carousel.
            skip_selector: '',

            touch_label: '',

            // event initializer and locks
            init: false,
            locked: false
        },

        init: function(scope, method, options) {
            var self = this;
            Mobile.inherit(this, 'image_loaded');

            this.bindings(method, options);

            if ($(this.scope).is('[data-' + this.name + ']')) {
                this.assemble($('li', this.scope));
            } else {
                $('[data-' + this.name + ']', this.scope).each(function() {
                    self.assemble($('li', this));
                });
            }
        },

        events: function(scope) {
            var self = this,
                $scroll_container = $('.scroll-container');

            if ($scroll_container.length > 0) {
                this.scope = $scroll_container;
            }

            $(this.scope)
                .off('.' + this.name)
                .on('click.' + this.name, 'ul[data-' + this.name + '] li ' + this.settings.open_selectors, function(e, current, target) {
                    var current = current || $(this),
                        target = target || current,
                        next = current.next('li'),
                        settings = current.closest('[data-' + self.name + ']').data(self.name + '-init'),
                        image = $(e.target);

                    e.preventDefault();

                    if (!settings) {
                        self.init();
                        settings = current.closest('[data-' + self.name + ']').data(self.name + '-init');
                    }

                    // if imagesbox is open and the current image is
                    // clicked, go to the next image in sequence
                    if (target.hasClass('visible') &&
                            current[0] === target[0] &&
                            next.length > 0 && self.is_open(current)) {
                        target = next;
                        image = $('img', target);
                    }

                    // set current and target to the clicked li if not otherwise defined.
                    self.open(image, current, target);
                })

                .on('click.' + this.name, this.settings.close_selectors, function(e) {
                    self.close(e, this);
                });

            $(window).off('.' + this.name).on('resize.' + this.name, function() {
                self.resize();
            });

            this.swipe_events(scope);
        },

        swipe_events: function(scope) {
            var self = this;

            $(this.scope)
                .on('touchstart.' + this.name, '.visible-img', function(e) {
                    if (!e.touches) {
                        e = e.originalEvent;
                    }
                    var data = {
                        start_page_x: e.touches[0].pageX,
                        start_page_y: e.touches[0].pageY,
                        start_time: (new Date()).getTime(),
                        delta_x: 0,
                        is_scrolling: undefined
                    };

                    $(this).data('swipe-transition', data);
                    e.stopPropagation();
                })
                .on('touchmove.' + this.name, '.visible-img', function(e) {
                    if (!e.touches) {
                        e = e.originalEvent;
                    }
                    // Ignore pinch/zoom events
                    if (e.touches.length > 1 || e.scale && e.scale !== 1) {
                        return;
                    }

                    var data = $(this).data('swipe-transition');

                    if (typeof data === 'undefined') {
                        data = {};
                    }

                    data.delta_x = e.touches[0].pageX - data.start_page_x;

                    if (typeof data.is_scrolling === 'undefined') {
                        data.is_scrolling = !!(data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y));
                    }

                    if (!data.is_scrolling && !data.active) {
                        e.preventDefault();
                        var direction = (data.delta_x < 0) ? 'next' : 'prev';
                        data.active = true;
                        self.nav(e, direction);
                    }
                })
                .on('touchend.' + this.name, '.visible-img', function(e) {
                    $(this).data('swipe-transition', {});
                    e.stopPropagation();
                });
        },

        assemble: function($li) {
            var $el = $li.parent();

            if ($el.parent().hasClass('carousel')) {
                return;
            }

            $el.after('<div id="mobileImagesboxHolder"></div>');

            var grid = $el.detach(),
                grid_outerHTML = '';

            if (grid[0] == null) {
                return;
            } else {
                grid_outerHTML = grid[0].outerHTML;
            }

            var holder = $('#mobileImagesboxHolder'),
                settings = $el.data(this.name + '-init'),
                data = {
                    grid: '<div class="carousel">' + grid_outerHTML + '</div>',
                    viewing: settings.templates.viewing
                },
                wrapper = '<div class="imagesbox-assembled"><div>' + data.viewing + data.grid + '</div></div>',
                touch_label = this.settings.touch_label;

            if ('ontouchstart' in document) {
                wrapper = $(wrapper).find('.imagesbox-touch-label').html(touch_label).end();
            }

            holder.after(wrapper).remove();
        },

        open: function($image, current, target) {
            var body = $(document.body),
                root = target.closest('.imagesbox-assembled'),
                container = $('div', root).first(),
                visible_image = $('.visible-img', container),
                image = $('img', visible_image).not($image),
                label = $('.imagesbox-touch-label', container),
                error = false,
                loaded = {};

            // Event to disable scrolling on touch devices when Imagesbox is activated
            $('body').on('touchmove', function(e) {
                e.preventDefault();
            });

            image.error(function() {
                error = true;
            });

            function startLoad() {
                setTimeout(function() {
                    this.image_loaded(image, function() {
                        if (image.outerWidth() === 1 && !error) {
                            startLoad.call(this);
                        } else {
                            cb.call(this, image);
                        }
                    }.bind(this));
                }.bind(this), 100);
            }

            function cb(image) {
                var $image = $(image);
                $image.css('visibility', 'visible');
                $image.trigger('imageVisible');
                // toggle the gallery
                body.css('overflow', 'hidden');
                root.addClass('imagesbox-blackout');
                container.addClass('imagesbox-container');
                visible_image.show();
                this.fix_height(target)
                    .caption($('.imagesbox-caption', visible_image), $('img', target))
                    .center_and_label(image, label)
                    .shift(current, target, function() {
                        target.closest('li').siblings().removeClass('visible');
                        target.closest('li').addClass('visible');
                    });
                visible_image.trigger('opened.' + this.name);
            }

            if (!this.locked()) {
                visible_image.trigger('open.' + this.name);
                // set the image to the selected thumbnail
                loaded = this.load($image);
                image.attr('src', loaded.src);
                // if (loaded.responsive) {
                //     image
                //         .attr('data-responsive', loaded.responsive)
                //         .mobile('responsive', 'reflow');
                // } else {
                //     image
                //         .attr('src', loaded.src)
                //         .attr('data-responsive', '');
                // }
                image.css('visibility', 'hidden');

                startLoad.call(this);
            }
        },

        close: function(e, el) {
            e.preventDefault();

            var root = (function(target) {
                    if (/blackout/.test(target.selector)) {
                        return target;
                    } else {
                        return target.closest('.imagesbox-blackout');
                    }
                }($(el))),
                body = $(document.body),
                container, visible_image;

            if (el === e.target && root) {
                body.css('overflow', '');
                container = $('div', root).first();
                visible_image = $('.visible-img', container);
                visible_image.trigger('close.' + this.name);
                this.settings.prev_index = 0;
                $('ul[data-' + this.name + ']', root)
                    .attr('style', '').closest('.imagesbox-blackout')
                    .removeClass('imagesbox-blackout');
                container.removeClass('imagesbox-container');
                visible_image.hide();
                visible_image.trigger('closed.' + this.name);
            }

            // Event to re-enable scrolling on touch devices
            $('body').off('touchmove');

            return false;
        },

        is_open: function(current) {
            return current.parent().prop('style').length > 0;
        },

        nav: function(e, direction) {
            var container = $('ul[data-' + this.name + ']', '.imagesbox-blackout');

            e.preventDefault();
            this.go(container, direction);
        },

        resize: function() {
            var image = $('img', '.imagesbox-blackout .visible-img'),
                label = $('.imagesbox-touch-label', '.imagesbox-blackout');

            if (image.length) {
                this.center_and_label(image, label);
                image.trigger('resized.' + this.name);
            }
        },

        // visual adjustments
        fix_height: function(target) {
            var lis = target.parent().children();

            lis.each(function() {
                var li = $(this),
                    image = li.find('img');

                if (li.height() > image.outerHeight()) {
                    li.addClass('fix-height');
                }
            })
                .closest('ul')
                .width(lis.length * 100 + '%');

            return this;
        },

        center_and_label: function(target, label) {
            if (label.length > 0) {
                label.css({
                    marginLeft: -(label.outerWidth() / 2),
                    marginTop: -(target.outerHeight() / 2) - label.outerHeight() - 10
                });
            }
            return this;
        },

        // image loading and preloading

        load: function($image) {
            var href,
                // responsive,
                closest_a;

            if ($image[0].nodeName === 'A') {
                href = $image.attr('href');
                // responsive = $image.data('imagesbox-responsive');
            } else {
                closest_a = $image.closest('a');
                href = closest_a.attr('href');
                // responsive = closest_a.data('imagesbox-responsive');
            }

            this.preload($image);

            return {
                'src': href ? href : $image.attr('src')
                // 'responsive': href ? responsive : $image.data('imagesbox-responsive')
            };
        },

        preload: function($image) {
            this
                .img($image.closest('li').next(), 'next')
                .img($image.closest('li').prev(), 'prev');
        },

        img: function(img, sibling_type) {
            if (img.length) {
                var preload_img = $('.imagesbox-preload-' + sibling_type),
                    new_a = $('a', img),
                    src,
                    // responsive,
                    image;

                if (new_a.length) {
                    src = new_a.attr('href');
                    // responsive = new_a.data('imagesbox-responsive');
                } else {
                    image = $('img', img);
                    src = image.attr('src');
                    // responsive = image.data('imagesbox-responsive');
                }

                preload_img.attr('src', src);
                // if (responsive) {
                //     preload_img.attr('data-responsive', responsive);
                // } else {
                //     preload_img.attr('src', src);
                //     preload_img.attr('data-responsive', '');
                // }
            }
            return this;
        },

        // image caption

        caption: function(container, $image) {
            var caption = $image.attr('data-caption');

            if (caption) {
                var containerPlain = container.get(0);
                containerPlain.innerHTML = caption;
                container.show();
            } else {
                container
                    .text('')
                    .hide();
            }
            return this;
        },

        // directional methods

        go: function($ul, direction) {
            var current = $('.visible', $ul),
                target = current[direction]();

            // Check for skip selector.
            if (this.settings.skip_selector && target.find(this.settings.skip_selector).length != 0) {
                target = target[direction]();
            }

            if (target.length) {
                $('img', target)
                    .trigger('click.' + this.name, [current, target])
                    .trigger('change.' + this.name);
            }
        },

        shift: function(current, target, callback) {
            var container = target.parent(),
                old_index = this.settings.prev_index || target.index(),
                direction = this.direction(container, current, target),
                left = parseInt(container.css('left'), 10),
                width = target.outerWidth(),
                skip_shift;

            var dir_obj = {};

            // we use jQuery animate instead of CSS transitions because we
            // need a callback to unlock the next animation
            // needs support for RTL **
            if (target.index() !== old_index && !/skip/.test(direction)) {
                if (/left/.test(direction)) {
                    this.lock();
                    dir_obj.left = left + width;
                    container.animate(dir_obj, 300, this.unlock());
                } else if (/right/.test(direction)) {
                    this.lock();
                    dir_obj.left = left - width;
                    container.animate(dir_obj, 300, this.unlock());
                }
            } else if (/skip/.test(direction)) {
                // the target image is not adjacent to the current image, so
                // do we scroll right or not
                skip_shift = target.index() - this.settings.up_count;
                this.lock();

                if (skip_shift > 0) {
                    dir_obj.left = -(skip_shift * width);
                    container.animate(dir_obj, 300, this.unlock());
                } else {
                    dir_obj.left = 0;
                    container.animate(dir_obj, 300, this.unlock());
                }
            }

            callback();
        },

        direction: function($el, current, target) {
            var lis = $('li', $el),
                li_width = lis.outerWidth() + (lis.outerWidth() / 4),
                up_count = Math.floor($('.imagesbox-container').outerWidth() / li_width) - 1,
                target_index = lis.index(target),
                response;

            this.settings.up_count = up_count;

            if (this.adjacent(this.settings.prev_index, target_index)) {
                if ((target_index > up_count) && target_index > this.settings.prev_index) {
                    response = 'right';
                } else if ((target_index > up_count - 1) && target_index <= this.settings.prev_index) {
                    response = 'left';
                } else {
                    response = false;
                }
            } else {
                response = 'skip';
            }

            this.settings.prev_index = target_index;

            return response;
        },

        adjacent: function(current_index, target_index) {
            for (var i = target_index + 1; i >= target_index - 1; i--) {
                if (i === current_index) {
                    return true;
                }
            }
            return false;
        },

        // lock management

        lock: function() {
            this.settings.locked = true;
        },

        unlock: function() {
            this.settings.locked = false;
        },

        locked: function() {
            return this.settings.locked;
        },

        off: function() {
            $(this.scope).off('.' + this.name);
            $(window).off('.' + this.name);
        },

        reflow: function() {
            this.init();
        }
    };

}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    var openModals = [];

    Mobile.libs.modal = {
        name: 'modal',

        locked: false,

        settings: {
            animation: 'fade',
            animation_speed: 250,
            close_on_backdrop_click: true,
            close_on_esc: true,
            close_modal_class: 'close-modal',
            multiple_opened: false,
            backdrop: true,
            backdrop_class: 'backdrop',
            root_element: 'body',
            no_scroll: true,
            preventTargetDefault: true,
            open: $.noop,
            opened: $.noop,
            close: $.noop,
            closed: $.noop,
            on_ajax_error: $.noop,
            css: {
                open: {
                    'opacity': 0,
                    'visibility': 'visible'
                },
                close: {
                    'opacity': 1,
                    'visibility': 'hidden'
                }
            }
        },

        init: function(scope, method, options) {
            $.extend(true, this.settings, method, options);
            this.bindings(method, options);
        },

        events: function(scope) {
            var self = this;

            $(this.scope)
                .off('.' + this.name)
                .on('click.' + this.name, '[data-' + this.name + '-id]:not(:disabled):not(.disabled)', function(e) {
                    if(self.settings.preventTargetDefault) e.preventDefault();

                    if (!self.locked) {
                        var element = $(this),
                            ajax = element.data(this.name + '-ajax'),
                            replaceContentSel = element.data(this.name + '-replace-content');

                        self.locked = true;

                        if (typeof ajax === 'undefined') {
                            self.open.call(self, element);
                        } else {
                            var url = ajax === true ? element.attr('href') : ajax;
                            self.open.call(self, element, {
                                url: url
                            }, {
                                replaceContentSel: replaceContentSel
                            });
                        }
                    }
                });

            $(document)
                // .off('click.' + this.name)
                .on('click.' + this.name, this.close_targets(), function(e) {
                    if (self.settings.preventTargetDefault) e.preventDefault();
                    if (!self.locked) {
                        var settings = $('[data-' + self.name + '].open').data(self.name + '-init') || self.settings,
                            backdrop_clicked = settings.backdrop && ($(e.target)[0] === $('.' + settings.backdrop_class)[0]);

                        if (backdrop_clicked) {
                            if (settings.close_on_backdrop_click) {
                                e.stopPropagation();
                            } else {
                                return;
                            }
                        }

                        self.locked = true;
                        self.close.call(self, backdrop_clicked ? $('[data-' + self.name + '].open:not(.toback)') : $(this).closest('[data-' + self.name + ']'));
                    }
                });

            if ($('[data-' + this.name + ']', this.scope).length > 0) {
                $(this.scope)
                    // .off('.' + this.name)
                    .on('open.' + this.name, this.settings.open)
                    .on('opened.' + this.name, this.settings.opened)
                    .on('opened.' + this.name, this.open_video)
                    .on('close.' + this.name, this.settings.close)
                    .on('closed.' + this.name, this.settings.closed)
                    .on('closed.' + this.name, this.close_video);
            } else {
                $(this.scope)
                    // .off('.' + this.name)
                    .on('open.' + this.name, '[data-' + this.name + ']', this.settings.open)
                    .on('opened.' + this.name, '[data-' + this.name + ']', this.settings.opened)
                    .on('opened.' + this.name, '[data-' + this.name + ']', this.open_video)
                    .on('close.' + this.name, '[data-' + this.name + ']', this.settings.close)
                    .on('closed.' + this.name, '[data-' + this.name + ']', this.settings.closed)
                    .on('closed.' + this.name, '[data-' + this.name + ']', this.close_video);
            }

            return true;
        },

        open: function(target, ajax_settings) {
            var self = this,
                container;

            if (target) {
                if (typeof target.selector !== 'undefined') {
                    // Find the named node; only use the first one found, since the rest of the code assumes there's only one node
                    container = $('#' + target.data(this.name + '-id')).first();
                } else {
                    container = $(this.scope);

                    ajax_settings = target;
                }
            } else {
                container = $(this.scope);
            }

            var settings = container.data(this.name + '-init');
            settings = settings || this.settings;

            if (container.hasClass('open') && target !== undefined && target.data(this.name + '-id') == container.attr('id')) {
                return this.close(container);
            }

            if (!container.hasClass('open')) {
                var open_container = $('[data-' + this.name + '].open');

                container.attr('tabindex', '0').attr('aria-hidden', 'false');

                // prevents annoying scroll positioning bug with position: absolute;
                if (settings.no_scroll) {
                    var $doc = $('html');
                    $doc.one('open.' + this.name, function() {
                        $(this).addClass('modal-open');
                    }).on('touchmove.' + this.name, function(e) {
                        e.preventDefault();
                    });
                }

                // Prevent namespace event from triggering twice
                container.on('open.' + this.name, function(e) {
                    if (e.namespace !== this.name) return;
                });

                container.on('open.' + this.name).trigger('open.' + this.name);

                if (open_container.length < 1) {
                    this.toggle_backdrop(container, true);
                }

                if (typeof ajax_settings === 'string') {
                    ajax_settings = {
                        url: ajax_settings
                    };
                }

                var openModal = function() {
                    if (open_container.length > 0) {
                        if (settings.multiple_opened) {
                            self.to_back(open_container);
                        } else {
                            self.hide(open_container, settings.css.close);
                        }
                    }

                    // bl: add the open_container that isn't already in the background to the openModals array
                    if (settings.multiple_opened) {
                        openModals.push(container);
                    }

                    self.show(container, settings.css.open);
                };

                if (typeof ajax_settings === 'undefined' || !ajax_settings.url) {
                    openModal();
                } else {
                    var old_success = typeof ajax_settings.success !== 'undefined' ? ajax_settings.success : null;
                    $.extend(ajax_settings, {
                        success: function(data, textStatus, jqXHR) {
                            if ($.isFunction(old_success)) {
                                var result = old_success(data, textStatus, jqXHR);
                                if (typeof result == 'string') {
                                    data = result;
                                }
                            }

                            if (typeof options !== 'undefined' && typeof options.replaceContentSel !== 'undefined') {
                                container.find(options.replaceContentSel).html(data);
                            } else {
                                container.html(data);
                            }

                            $(container)
                                .mobile('section', 'reflow')
                                .children().mobile();

                            openModal();
                        }
                    });

                    // check for if user initalized with error callback
                    if (settings.on_ajax_error !== $.noop) {
                        $.extend(ajax_settings, {
                            error: settings.on_ajax_error
                        });
                    }

                    $.ajax(ajax_settings);
                }
            }
            $(window).trigger('resize');
        },

        close: function(container) {
            var container = container && container.length ? container : $(this.scope),
                open_containers = $('[data-' + this.name + '].open'),
                settings = container.data(this.name + '-init') || this.settings,
                self = this;

            if (open_containers.length > 0) {

                container.removeAttr('tabindex', '0').attr('aria-hidden', 'true');

                // prevents annoying scroll positioning bug with position: absolute;
                if (settings.no_scroll) {
                    var $doc = $('html');
                    $doc.one('close.' + this.name, function() {
                        $(this).removeClass('modal-open');
                    })
                        .off('touchmove');
                }

                this.locked = true;

                container.trigger('close.' + this.name);

                if ((settings.multiple_opened && open_containers.length === 1) || !settings.multiple_opened || container.length > 1) {
                    this.toggle_backdrop(container, false);
                    this.to_front(container);
                }

                if (settings.multiple_opened) {
                    var isCurrent = container.is(':not(.toback)');
                    this.hide(container, settings.css.close, settings);
                    if (isCurrent) {
                        // remove the last container since it is now closed
                        openModals.pop();
                    } else {
                        // if this isn't the current container, then find it in the array and remove it
                        openModals = $.grep(openModals, function(elt) {
                            var isThis = elt[0] === container[0];
                            if (isThis) {
                                // since it's not currently in the front, put it in the front now that it is hidden
                                // so that if it's re-opened, it won't be .toback
                                self.to_front(container);
                            }
                            return !isThis;
                        });
                    }
                    // finally, show the next container in the stack, if there is one
                    if (openModals.length > 0) {
                        this.to_front(openModals[openModals.length - 1]);
                    }
                } else {
                    this.hide(open_containers, settings.css.close, settings);
                }
            }
        },

        close_targets: function() {
            var base = '.' + this.settings.close_modal_class;

            if (this.settings.backdrop && this.settings.close_on_backdrop_click) {
                return base + ', .' + this.settings.backdrop_class;
            }

            return base;
        },

        toggle_backdrop: function(container, state) {
            if (!this.settings.backdrop) return;
            if ($('.' + this.settings.backdrop_class).length === 0) {
                this.settings.backdrop = $('<div />', {
                    'class': this.settings.backdrop_class
                })
                    .appendTo('body').hide();
            }

            var visible = this.settings.backdrop.filter(':visible').length > 0;
            if (state != visible) {
                if (state == undefined ? visible : !state) {
                    this.hide(this.settings.backdrop);
                } else {
                    this.show(this.settings.backdrop);
                }
            }
        },

        show: function(el, css) {
            // is container
            var self = this;
            if (css) {
                var settings = el.data(this.name + '-init') || this.settings,
                    root_element = settings.root_element,
                    context = this;

                if (el.parent(root_element).length === 0) {
                    var placeholder = el.wrap('<div style="display: none;" />').parent();

                    el.on('closed.' + this.name + '.wrapped', function() {
                        el.detach().appendTo(placeholder);
                        el.unwrap().unbind('closed.' + this.name + '.wrapped');
                    });

                    el.detach().appendTo(root_element);
                }

                var animData = getAnimationData(settings.animation);
                if (!animData.animate) {
                    this.locked = false;
                }

                if (animData.fade) {
                    var end_css = {
                        opacity: 1
                    };

                    return requestAnimationFrame(function() {
                        return el
                            .css(css)
                            .animate(end_css, settings.animation_speed, 'linear', function() {
                                context.locked = false;
                                el.trigger('opened.' + self.name);
                            })
                            .addClass('open')
                            .trigger('open.' + self.name);
                    });
                }

                return el.css(css)
                    .addClass('open')
                    .trigger('opened.' + this.name);
            }

            var settings = this.settings;

            // should we animate the background?
            if (getAnimationData(settings.animation).fade) {
                return el.fadeIn(settings.animation_speed);
            }

            this.locked = false;

            return el.show();
        },

        to_back: function(el) {
            el.addClass('toback');
        },

        to_front: function(el) {
            el.removeClass('toback');
        },

        hide: function(el, css) {
            // is container
            var self = this;
            if (css) {
                var settings = el.data(this.name + '-init'),
                    context = this;
                settings = settings || this.settings;

                var animData = getAnimationData(settings.animation);
                if (!animData.animate) {
                    this.locked = false;
                }

                if (animData.fade) {
                    var end_css = {
                        opacity: 0
                    };

                    return requestAnimationFrame(function() {
                        return el
                            .animate(end_css, settings.animation_speed, 'linear', function() {
                                context.locked = false;
                                el.css(css).trigger('closed.' + self.name);
                            })
                            .removeClass('open');
                    });
                }

                return el.css(css).removeClass('open').trigger('closed.' + this.name);
            }

            var settings = this.settings;

            // should we animate the background?
            if (getAnimationData(settings.animation).fade) {
                return el.fadeOut(settings.animation_speed);
            }

            return el.hide();
        },

        close_video: function(e) {
            var video = $('.flex-video', e.target),
                iframe = $('iframe', video);

            if (iframe.length > 0) {
                iframe.attr('data-src', iframe[0].src);
                iframe.attr('src', iframe.attr('src'));
                video.hide();
            }
        },

        open_video: function(e) {
            var video = $('.flex-video', e.target),
                iframe = video.find('iframe');

            if (iframe.length > 0) {
                var data_src = iframe.attr('data-src');
                if (typeof data_src === 'string') {
                    iframe[0].src = iframe.attr('data-src');
                } else {
                    var src = iframe[0].src;
                    iframe[0].src = undefined;
                    iframe[0].src = src;
                }
                video.show();
            }
        },

        off: function() {
            $(this.scope).off('.' + this.name);
        },

        reflow: function() {}
    };

    /*
     * getAnimationData('fade')       // {animate: true,  fade: true}
     * getAnimationData(null)         // {animate: false, fade: false}
     */
    function getAnimationData(str) {
        var fade = /fade/i.test(str);
        return {
            animate: fade,
            fade: fade
        };
    }
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.numberspin = {
        name: 'numberspin',

        settings: {
            min: 0, // Minimum value.
            max: Number.MAX_VALUE, // Maximum value.
            step: 1, // Incremental/decremental step on up/down change.
            // defaultValue: null, // Applied when no correct value is set on the input with value attribute.
            autoInit: true, // Auto fill the input value with settings' 'defaultValue' or 'min'.
            // Execute this function before the input value change with return true or false.
            // beforeValid: $.noop,
            // show message when validate is error
            validMessage: {
                target: null,
                min: '不能小于{min}',
                max: '不能大于{max}',
                notnumber: '只能输入数字',
                show: {
                    display: 'block'
                },
                hide: {
                    display: 'none'
                }
            },
            // Execute after validate is error
            // validError: null,
            // Execute after validate is success
            // validSuccess: null
        },

        init: function(scope, method, options) {
            this.bindings(method, options);
        },

        events: function() {
            var self = this;
            $(this.scope)
                .off('.' + this.name)
                .on('touchstart.' + this.name, '[data-' + this.name + '] > button:not(:disabled)', function(e) {
                    e.preventDefault();

                    var target = $(this).parent('[data-' + self.name + ']');
                    var input = target.find('input[type=text], input[type=number]');
                    var value = +input.val();
                    var settings = self.getSettings(input, value, target);

                    if (typeof settings.beforeValidate !== 'function' || settings.beforeValidate(input)) {
                        value += $(this).hasClass('prefix') ? -settings.step : settings.step;
                        self.setValue(input, value, target, settings);
                    }
                })
                .on('focus.' + this.name, '[data-' + this.name + '] > input', function(e) {
                    // Make default value as a Number.
                    self.settings.defaultValue = +this.value;
                })
                .on('change.' + this.name, '[data-' + this.name + '] > input', function(e) {
                    var input = $(this);
                    var target = input.parent('[data-' + self.name + ']');
                    var settings = self.getSettings(input, self.settings.defaultValue, target);
                    if (typeof settings.beforeValidate !== 'function' || settings.beforeValidate($(this))) {
                        self.setValue($(this), +input.val(), target, settings);
                    }
                });

            if (this.settings.autoInit) {
                $(this.scope).find('[data-' + this.name + ']').each(function() {
                    var target = $(this);
                    var input = target.find('input');
                    var settings = self.getSettings(input, input.val(), target);
                    input.val(settings.defaultValue);
                    target.trigger('init.' + self.name, [input]);
                });
            }
        },

        getSettings: function(input, value, target) {
            var settings = target.data(this.name + '-init');
            return $.extend(settings, {
                min: +input.attr('min'),
                max: +input.attr('max'),
                step: +input.attr('step') || 1,
                defaultValue: value || input.attr('min') || this.settings.min
            });
        },

        setValue: function(input, value, target, settings) {
            if (this.validate(input, value, target, settings)) {
                input.val(value);
                settings.defaultValue = value;
                target.trigger('valuechange.' + this.name, [input]);
            }
        },

        validate: function(input, value, target, settings) {
            var msg = '';
            var result = false;
            var alertBox = target.next(settings.validMessage.target);
            alertBox = alertBox.length ? alertBox : $(settings.validMessage.target);

            if (value == settings.min) {
                target.trigger('min.' + this.name, [input]);
            } else if (value < settings.min) {
                value = settings.min;
                msg = settings.validMessage.min.replace('{min}', settings.min);
            } else if (value == settings.max) {
                target.trigger('max.' + this.name, [input]);
            } else if (value > settings.max) {
                value = settings.max;
                msg = settings.validMessage.max.replace('{max}', settings.max);
            } else if (!/^-?\d*$/.test(value)) {
                value = settings.defaultValue;
                target.trigger('notnumber.' + this.name, [input]);
                msg = settings.validMessage.notnumber;
            }
            if (msg) {
                if (typeof settings.validError === 'function') settings.validError(target, input, msg);
                else if(alertBox.length) alertBox.css(settings.validMessage.show).html(msg);
                else alert(msg);
                result = false;
            } else {
                if (typeof settings.validSuccess === 'function') settings.validSuccess(target, input);
                else if(alertBox.length) alertBox.css(settings.validMessage.hide);
                result = true;
            }
            return result;
        },

        reflow: function() {}
    };
})(jQuery, window, window.document);

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.offcanvas = {
        name: 'offcanvas',

        settings: {
            open_method: 'move',
            close_on_click: false
        },

        init: function(scope, method, options) {
            this.bindings(method, options);
        },

        events: function() {
            var self = this,
                move_class = '',
                right_postfix = '',
                left_postfix = '',
                settings = this.settings;

            if (settings.open_method === 'move') {
                move_class = 'move-';
                right_postfix = 'right';
                left_postfix = 'left';
            } else if (settings.open_method === 'overlap_single') {
                move_class = 'overlap-';
                right_postfix = 'right';
                left_postfix = 'left';
            } else if (settings.open_method === 'overlap') {
                move_class = 'overlap';
            }

            $(this.scope)
                .off('.' + this.name)
                .on('click.' + this.name, '[data-' + this.name + '] .left-offcanvas-toggle', function(e) {
                    // var settings = self.get_settings(e);
                    var $off_canvas = self.get_wrapper(e);
                    self.click_toggle_class(e, move_class + right_postfix);
                    if (settings.open_method !== 'overlap') {
                        $off_canvas.find('.left.offcanvas-submenu').removeClass(move_class + right_postfix);
                    }
                    $(this).attr('aria-expanded', 'true');
                })
                .on('click.' + this.name, '[data-' + this.name + '] .left.offcanvas-menu a', function(e) {
                    var settings = self.get_settings(e);
                    var parent = $(this).parent('li');
                    var $off_canvas = self.get_wrapper(e);

                    if (settings.close_on_click && !parent.hasClass('has-submenu') && !parent.hasClass('back')) {
                        self.hide.call(self, move_class + right_postfix, self.get_wrapper(e));
                        parent.parent().removeClass(move_class + right_postfix);
                    } else if (parent.hasClass('has-submenu')) {
                        e.preventDefault();
                        $(this).siblings('.left.offcanvas-submenu').toggleClass(move_class + right_postfix);
                    } else if (parent.hasClass('back')) {
                        e.preventDefault();
                        parent.parent().removeClass(move_class + right_postfix);
                    }
                    $off_canvas.find('.left-offcanvas-toggle').attr('aria-expanded', 'true');
                })
                //end of left canvas
                .on('click.' + this.name, '[data-' + this.name + '] .right-offcanvas-toggle', function(e) {
                    // var settings = self.get_settings(e);
                    var $off_canvas = self.get_wrapper(e);
                    self.click_toggle_class(e, move_class + left_postfix);
                    if (settings.open_method !== 'overlap') {
                        $off_canvas.find('.right.offcanvas-submenu').removeClass(move_class + left_postfix);
                    }
                    $(this).attr('aria-expanded', 'true');
                })
                .on('click.' + this.name, '[data-' + this.name + '] .right.offcanvas-menu a', function(e) {
                    var settings = self.get_settings(e);
                    var parent = $(this).parent('li');
                    var $off_canvas = self.get_wrapper(e);

                    if (settings.close_on_click && !parent.hasClass('has-submenu') && !parent.hasClass('back')) {
                        self.hide.call(self, move_class + left_postfix, self.get_wrapper(e));
                        parent.parent().removeClass(move_class + left_postfix);
                    } else if (parent.hasClass('has-submenu')) {
                        e.preventDefault();
                        $(this).siblings('.right.offcanvas-submenu').toggleClass(move_class + left_postfix);
                    } else if (parent.hasClass('back')) {
                        e.preventDefault();
                        parent.parent().removeClass(move_class + left_postfix);
                    }
                    $off_canvas.find('.right-offcanvas-toggle').attr('aria-expanded', 'true');
                })
                //end of right canvas
                .on('click.' + this.name, '[data-' + this.name + '] .exit-offcanvas', function(e) {
                    var $off_canvas = self.get_wrapper(e);
                    self.click_remove_class(e, move_class + left_postfix);
                    $off_canvas.find('.right.offcanvas-submenu').removeClass(move_class + left_postfix);
                    if (right_postfix) {
                        self.click_remove_class(e, move_class + right_postfix);
                        $off_canvas.find('.left.offcanvas-submenu').removeClass(move_class + left_postfix);
                    }
                    $off_canvas.find('.right-offcanvas-toggle').attr('aria-expanded', 'true');
                })
                .on('click.' + this.name, '[data-' + this.name + '] .exit-offcanvas', function(e) {
                    var $off_canvas = self.get_wrapper(e);
                    self.click_remove_class(e, move_class + left_postfix);
                    $off_canvas.find('.left-offcanvas-toggle').attr('aria-expanded', 'false');
                    if (right_postfix) {
                        self.click_remove_class(e, move_class + right_postfix);
                        $off_canvas.find('.right-offcanvas-toggle').attr('aria-expanded', 'false');
                    }
                });
        },

        toggle: function(class_name, $off_canvas) {
            if ($off_canvas.hasClass(class_name)) {
                this.hide(class_name, $off_canvas);
            } else {
                this.show(class_name, $off_canvas);
            }
        },

        show: function(class_name, $off_canvas) {
            $off_canvas.trigger('open.' + this.name);
            $off_canvas.addClass(class_name);
            if(this.settings.open_method !== 'move') {
                $off_canvas.find('.offcanvas-menu').addClass('no-transform');
            }
        },

        hide: function(class_name, $off_canvas) {
            $off_canvas.trigger('close.' + this.name);
            $off_canvas.removeClass(class_name);
            if(this.settings.open_method !== 'move') {
                $off_canvas.find('.no-transform').removeClass('no-transform');
            }
        },

        click_toggle_class: function(e, class_name) {
            e.preventDefault();
            var $off_canvas = this.get_wrapper(e);
            this.toggle(class_name, $off_canvas);
        },

        click_remove_class: function(e, class_name) {
            e.preventDefault();
            var $off_canvas = this.get_wrapper(e);
            this.hide(class_name, $off_canvas);
        },

        get_settings: function(e) {
            var container = $(e.target).closest('[data-' + this.name + ']');
            return container.data(this.name + '-init') || this.settings;
        },

        get_wrapper: function(e) {
            var $off_canvas = $(e ? e.target : this.scope).closest('.offcanvas-wrap');

            if ($off_canvas.length === 0) {
                $off_canvas = $('.offcanvas-wrap');
            }

            return $off_canvas;
        },

        reflow: function() {}
    };
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.responsive = {
        name: 'responsive',

        cache: {},

        loaded: false,

        settings: {
            named_queries: {
                'default': 'only screen',
                'small': Mobile.media_queries['small'],
                'small-only': Mobile.media_queries['small-only'],
                'medium': Mobile.media_queries['medium'],
                'medium-only': Mobile.media_queries['medium-only'],
                'landscape': 'only screen and (orientation: landscape)',
                'portrait': 'only screen and (orientation: portrait)',
                'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2),' +
                    'only screen and (min-device-pixel-ratio: 2),' +
                    'only screen and (min-resolution: 192dpi),' +
                    'only screen and (min-resolution: 2dppx)',
                'retina3x': 'only screen and (-webkit-min-device-pixel-ratio: 3),' +
                    'only screen and (min-device-pixel-ratio: 3),' +
                    'only screen and (min-resolution: 249dpi),' +
                    'only screen and (min-resolution: 2.6dppx)'
            },

            directives: {
                replace: function(el, path, trigger) {
                    var orig_path,
                        last_path;
                    // The trigger argument, if called within the directive, fires
                    // an event named after the directive on the element, passing
                    // any parameters along to the event that you pass to trigger.
                    //
                    // ex. trigger(), trigger([a, b, c]), or trigger(a, b, c)
                    //
                    // This allows you to bind a callback like so:
                    // $('#responsiveContainer').on('replace', function (e, a, b, c) {
                    //   console.log($(this).html(), a, b, c);
                    // });

                    if (el !== null && /IMG/.test(el[0].nodeName)) {
                        orig_path = el[0].src;
                        // orig_path = el.each(function() {
                        //     this.src = path;
                        // });

                        if (new RegExp(path, 'i').test(orig_path)) {
                            return;
                        }

                        el.attr('src', path);

                        return trigger(el[0].src);
                    }
                    last_path = el.data(this.name + '-last-path'),
                    self = this;

                    if (last_path == path) {
                        return;
                    }

                    if (/\.(gif|jpg|jpeg|tiff|png)([?#].*)?/i.test(path)) {
                        $(el).css('background-image', 'url(' + path + ')');
                        el.data(this.name + '-last-path', path);
                        return trigger(path);
                    }

                    return $.get(path, function(response) {
                        el.html(response);
                        el.data(self.name + '-last-path', path);
                        trigger();
                    });

                }
            }
        },

        init: function(scope, method, options) {
            Mobile.inherit(this, 'random_str');

            this.data_attr = 'data-' + this.name;
            $.extend(true, this.settings, method, options);
            this.bindings(method, options);
            this.reflow();
        },

        get_media_hash: function() {
            var mediaHash = '';
            for (var queryName in this.settings.named_queries) {
                mediaHash += matchMedia(this.settings.named_queries[queryName]).matches.toString();
            }
            return mediaHash;
        },

        events: function() {
            var self = this,
                prevMediaHash;

            $(window)
                .off('.' + this.name)
                .on('resize.' + this.name, function() {
                    var currMediaHash = self.get_media_hash();
                    if (currMediaHash !== prevMediaHash) {
                        self.resize();
                    }
                    prevMediaHash = currMediaHash;
                });

            return this;
        },

        resize: function() {
            var cache = this.cache,
                uuid,
                passed,
                args;

            if (!this.loaded) {
                setTimeout($.proxy(this.resize, this), 50);
                return;
            }

            for (uuid in cache) {
                if (cache.hasOwnProperty(uuid)) {
                    passed = this.results(uuid, cache[uuid]);
                    if (passed) {
                        this.settings.directives[passed.scenario[1]]
                            .call(this, passed.el, passed.scenario[0], (function(passed) {
                                if (arguments[0] instanceof Array) {
                                    args = arguments[0];
                                } else {
                                    args = Array.prototype.slice.call(arguments, 0);
                                }

                                return function() {
                                    passed.el.trigger(passed.scenario[1], args);
                                };
                            }(passed)));
                    }
                }
            }

        },

        results: function(uuid, scenarios) {
            var count = scenarios.length,
                el = $('[data-uuid="' + uuid + '"]'),
                mq,
                rule,
                res = false;

            if (count > 0) {
                while (count--) {
                    rule = scenarios[count][2];
                    if (this.settings.named_queries.hasOwnProperty(rule)) {
                        mq = matchMedia(this.settings.named_queries[rule]);
                    } else {
                        mq = matchMedia(rule);
                    }
                    if (mq.matches) {
                        res = {
                            el: el,
                            scenario: scenarios[count]
                        };
                        break;
                    }
                }
            }

            return res;
        },

        load: function(force_update) {
            if (typeof this.cached_nodes === 'undefined' || force_update) {
                this.update_responsiveness();
            }
        },

        update_responsiveness: function() {
            var data_attr = this.data_attr,
                elements = $('[' + data_attr + ']'),
                count = elements.length,
                i = count,
                element,
                str;

            this.cache = {};
            this.cached_nodes = [];
            this.loaded = count === 0;

            while (i--) {
                element = elements[i];

                if (element) {
                    str = element.getAttribute(data_attr) || '';

                    if (str.length > 0) {
                        this.cached_nodes.push(element);
                    }
                }

            }

            this.loaded = true;
            this.enhance();

            return this;
        },

        enhance: function() {
            var i = this.cached_nodes.length;

            while (i--) {
                this.object($(this.cached_nodes[i]));
            }

            $(window).trigger('resize.' + this.name);
        },

        convert_directive: function(directive) {

            var trimmed = this.trim(directive);

            if (trimmed.length > 0) {
                return trimmed;
            }

            return 'replace';
        },

        parse_scenario: function(scenario) {
            // This logic had to be made more complex since some users were using commas in the url path
            // So we cannot simply just split on a comma

            var directive_match = scenario[0].match(/(.+),\s*(\w+)\s*$/),
                // getting the mq has gotten a bit complicated since we started accounting for several use cases
                // of URLs. For now we'll continue to match these scenarios, but we may consider having these scenarios
                // as nested objects or arrays in F6.
                // regex: match everything before close parenthesis for mq
                media_query = scenario[1].match(/\((.*)\)/);

            if (directive_match) {
                var path = directive_match[1],
                    directive = directive_match[2];

            } else {
                var cached_split = scenario[0].split(/,\s*$/),
                    path = cached_split[0],
                    directive = '';
            }

            return [this.trim(path), this.convert_directive(directive), this.trim(media_query[1])];
        },

        object: function(el) {
            var raw_arr = this.parse_data_attr(el),
                i = raw_arr.length,
                scenarios = [],
                scenario,
                params;

            if (i > 0) {
                while (i--) {
                    // split array between comma delimited content and mq
                    // regex: comma, optional space, open parenthesis
                    scenario = raw_arr[i].split(/,\s*/);

                    if (scenario.length <= 1) {
                        scenario.push('(default)');
                    }
                    params = this.parse_scenario(scenario);
                    scenarios.push(params);
                }
            }

            this.store(el, scenarios);
        },

        store: function(el, scenarios) {
            var uuid = this.random_str(),
                current_uuid = el.data('uuid');

            if (!this.cache[current_uuid]) {
                el.attr('data-uuid', uuid);
                this.cache[uuid] = scenarios;
            }
        },

        parse_data_attr: function(el) {
            var raw = el.data(this.name).split(/\[(.*?)\]/),
                i = raw.length,
                output = [];

            while (i--) {
                if (raw[i].replace(/[\W\d]+/, '').length > 4) {
                    output.push(raw[i]);
                }
            }

            return output;
        },

        reflow: function() {
            this.load(true);
        }

    };

}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    var Slides = function(el, settings) {
        // Don't reinitialize plugin
        if (el.hasClass(settings.slides_container_class)) {
            return this;
        }

        var self = this,
            container,
            slides_container = el,
            bullets_container,
            idx = 0,
            animate,
            timer,
            locked = false,
            adjust_height_after = false;

        this.slides = function() {
            return slides_container.children(settings.slide_selector);
        };

        this.slides().first().addClass(settings.slide_active_class);

        this.update_slide_bullets = function(index) {
            if (settings.bullets) {
                bullets_container
                    .children().eq(index)
                    .addClass(settings.bullets_active_class)
                    .siblings('.' + settings.bullets_active_class)
                    .removeClass(settings.bullets_active_class);
            }
        };

        this.update_active_link = function(index) {
            var link = $('[data-slides-link="' + self.slides().eq(index).attr('data-slides-preview') + '"]');
            link
                .addClass(settings.bullets_active_class)
                .siblings('.' + settings.bullets_active_class)
                .removeClass(settings.bullets_active_class);
        };

        this.build_markup = function() {
            slides_container.wrap('<div class="' + settings.container_class + '"></div>');
            container = slides_container.parent();
            slides_container.addClass(settings.slides_container_class);

            if (settings.bullets) {
                bullets_container = $('<ol>').addClass(settings.bullets_container_class);
                container.append(bullets_container);
                bullets_container.wrap('<div class="slide-bullets-container"></div>');
                self.slides().each(function(idx, el) {
                    var bullet = $('<li>').data('slides-preview', idx);
                    bullets_container.append(bullet);
                });
            }

        };

        this._goto = function(next_idx, start_timer) {
            // if (locked) {return false;}
            if (next_idx === idx) {
                return false;
            }
            if (typeof timer === 'object') {
                timer.restart();
            }
            var slides = self.slides();

            var dir = 'next';
            locked = true;
            if (next_idx < idx) {
                dir = 'prev';
            }
            if (next_idx >= slides.length) {
                if (!settings.circular) {
                    return false;
                }
                next_idx = 0;
            } else if (next_idx < 0) {
                if (!settings.circular) {
                    return false;
                }
                next_idx = slides.length - 1;
            }

            var current = $(slides.get(idx));
            var next = $(slides.get(next_idx));

            current.css('zIndex', 2);
            current.removeClass(settings.slide_active_class);
            next.css('zIndex', 4).addClass(settings.slide_active_class);

            slides_container.trigger('before-slide-change.slides');
            settings.before_slide_change();
            self.update_active_link(next_idx);

            var callback = function() {
                var unlock = function() {
                    idx = next_idx;
                    locked = false;
                    if (start_timer === true) {
                        timer = self.create_timer();
                        timer.start();
                    }
                    self.update_slide_bullets(idx);
                    slides_container.trigger('after-slide-change.slides', [{
                        total_slides: slides.length
                    }]);
                    settings.after_slide_change(idx, slides.length);
                };
                if (slides_container.outerHeight() != next.outerHeight() && settings.variable_height) {
                    slides_container.animate({
                        'height': next.outerHeight()
                    }, 250, 'linear', unlock);
                } else {
                    unlock();
                }
            };

            if (slides.length === 1) {
                callback();
                return false;
            }

            var start_animation = function() {
                if (dir === 'next') {
                    animate.next(current, next, callback);
                }
                if (dir === 'prev') {
                    animate.prev(current, next, callback);
                }
            };

            if (next.outerHeight() > slides_container.outerHeight() && settings.variable_height) {
                slides_container.animate({
                    'height': next.outerHeight()
                }, 250, 'linear', start_animation);
            } else {
                start_animation();
            }
        };

        this.link_custom = function(e) {
            e.preventDefault();
            var link = $(this).attr('data-slides-link');
            if ((typeof link === 'string') && (link = $.trim(link)) != '') {
                var slide = container.find('[data-slides-preview=' + link + ']');
                if (slide.index() != -1) {
                    self._goto(slide.index());
                }
            }
        };

        this.timer_callback = function() {
            self._goto(idx + 1, true);
        };

        this.compute_dimensions = function() {
            var current = $(self.slides().get(idx));
            var h = current.outerHeight();
            if (!settings.variable_height) {
                self.slides().each(function() {
                    if ($(this).outerHeight() > h) {
                        h = $(this).outerHeight();
                    }
                });
            }
            slides_container.height(h);
        };

        this.create_timer = function() {
            var t = new Timer(settings, self.timer_callback);
            return t;
        };

        this.stop_timer = function() {
            if (typeof timer === 'object') {
                timer.stop();
            }
        };

        this.init = function() {
            self.build_markup();
            if (settings.autoplay) {
                timer = self.create_timer();
                Mobile.utils.image_loaded(this.slides().children('img'), timer.start);
            }
            animate = new FadeAnimation(settings, slides_container);
            if (settings.animation === 'slide') {
                animate = new SlideAnimation(settings, slides_container);
            }

            if (settings.swipe) {
                container.on('touchstart.slides', function(e) {
                    if (!e.touches) {
                        e = e.originalEvent;
                    }
                    var data = {
                        start_page_x: e.touches[0].pageX,
                        start_page_y: e.touches[0].pageY,
                        start_time: (new Date()).getTime(),
                        delta_x: 0,
                        is_scrolling: undefined
                    };
                    container.data('swipe-transition', data);
                    e.stopPropagation();
                })
                    .on('touchmove.slides', function(e) {
                        if (!e.touches) {
                            e = e.originalEvent;
                        }
                        // Ignore pinch/zoom events
                        if (e.touches.length > 1 || e.scale && e.scale !== 1) {
                            return;
                        }

                        var data = container.data('swipe-transition');
                        if (typeof data === 'undefined') {
                            data = {};
                        }

                        data.delta_x = e.touches[0].pageX - data.start_page_x;

                        if (typeof data.is_scrolling === 'undefined') {
                            data.is_scrolling = !!(data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y));
                        }

                        if (!data.is_scrolling && !data.active) {
                            e.preventDefault();
                            var direction = (data.delta_x < 0) ? (idx + 1) : (idx - 1);
                            data.active = true;
                            self._goto(direction);
                        }
                    })
                    .on('touchend.slides', function(e) {
                        container.data('swipe-transition', {});
                        e.stopPropagation();
                    });
            }

            $(document).on('click', '[data-slides-link]', self.link_custom);
            $(window).on('load resize', self.compute_dimensions);
            Mobile.utils.image_loaded(this.slides().children('img'), self.compute_dimensions);
            Mobile.utils.image_loaded(this.slides().children('img'), function() {
                container.prev('.' + settings.preloader_class).css('display', 'none');
                self.update_slide_bullets(0);
                self.update_active_link(0);
                slides_container.trigger('ready.slides');
            });
        };

        this.init();
    };

    var Timer = function(settings, callback) {
        var self = this,
            duration = settings.timer_speed,
            start,
            timeout,
            left = -1;

        this.restart = function() {
            clearTimeout(timeout);
            left = -1;
        };

        this.start = function() {
            left = (left === -1) ? duration : left;
            start = new Date().getTime();
            timeout = setTimeout(function() {
                self.restart();
                callback();
            }, left);
        };

        this.stop = function() {
            clearTimeout(timeout);
            var end = new Date().getTime();
            left = left - (end - start);
        };
    };

    var SlideAnimation = function(settings, container) {
        var duration = settings.animation_speed;
        var margin = 'marginLeft';
        var animMargin = {};
        animMargin[margin] = '0%';

        this.next = function(current, next, callback) {
            current.animate({
                marginLeft: '-100%'
            }, duration);
            next.animate(animMargin, duration, function() {
                current.css(margin, '100%');
                callback();
            });
        };

        this.prev = function(current, prev, callback) {
            current.animate({
                marginLeft: '100%'
            }, duration);
            prev.css(margin, '-100%');
            prev.animate(animMargin, duration, function() {
                current.css(margin, '100%');
                callback();
            });
        };
    };

    var FadeAnimation = function(settings, container) {
        var duration = settings.animation_speed;
        var margin = 'marginLeft';

        this.next = function(current, next, callback) {
            next.css({
                'margin': '0%',
                'opacity': '0.01'
            });
            next.animate({
                'opacity': '1'
            }, duration, 'linear', function() {
                current.css('margin', '100%');
                callback();
            });
        };

        this.prev = function(current, prev, callback) {
            prev.css({
                'margin': '0%',
                'opacity': '0.01'
            });
            prev.animate({
                'opacity': '1'
            }, duration, 'linear', function() {
                current.css('margin', '100%');
                callback();
            });
        };
    };

    Mobile.libs = Mobile.libs || {};

    Mobile.libs.slides = {
        name: 'slides',

        settings: {
            animation: 'slide',
            timer_speed: 5000,
            animation_speed: 500,
            container_class: 'slide-container',
            slides_container_class: 'previews',
            preloader_class: 'preloader',
            slide_selector: '*',
            bullets_container_class: 'slide-bullets',
            bullets_active_class: 'active',
            slide_active_class: 'active',
            bullets: true,
            circular: true,
            autoplay: true,
            variable_height: false,
            swipe: true,
            before_slide_change: $.noop,
            after_slide_change: $.noop
        },

        init: function(scope, method, options) {
            Mobile.inherit(this, 'image_loaded');
            this.bindings(method, options);
        },

        events: function(instance) {
            var slides_instance = new Slides($(instance), $(instance).data(this.name + '-init'));
            $(instance).data(this.name + '-instance', slides_instance);
        },

        reflow: function() {
            var self = this;

            if ($(this.scope).is('[data-' + this.name + ']')) {
                var $el = $(this.scope);
                var instance = $el.data(this.name + '-instance');
                instance.compute_dimensions();
            } else {
                $('[data-' + this.name + ']', this.scope).each(function(idx) {
                    var $el = $(this);
                    var opts = self.data_options($el);
                    var instance = $el.data(self.name + '-instance');
                    instance.compute_dimensions();
                });
            }
        }
    };

}(jQuery, window, window.document));


(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.tab = {
        name: 'tab',

        settings: {
            active_class: 'active',
            content_class: 'tab-content',
            panel_class: 'content',
            callback: function() {},
            deep_linking: false,
            scroll_to_content: true
        },

        default_tab_hashes: [],

        init: function(scope, method, options) {
            var self = this;

            // Store the default active tabs which will be referenced when the
            // location hash is absent, as in the case of navigating the tabs and
            // returning to the first viewing via the browser Back button.
            $('[data-' + this.name + '] > .active > a', this.scope).each(function() {
                self.default_tab_hashes.push(this.hash);
            });

            // store the initial href, which is used to allow correct behaviour of the
            // browser back button when deep linking is turned on.
            this.entry_location = window.location.href;

            this.bindings(method, options);
            this.handle_location_hash_change();
        },

        events: function() {
            var self = this;

            var usual_tab_behavior = function(e, target) {
                var settings = $(target).closest('[data-' + self.name + ']').data(self.name + '-init');
                if ('ontouchstart' in document) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggle_active_tab($(target).parent());
                }
            };

            $(this.scope)
                .off('.' + this.name)
                // Click event: tab title
                .on('click.' + this.name, '[data-' + this.name + '] > * > a', function(e) {
                    var el = this;
                    usual_tab_behavior(e, el);
                });

            // Location hash change event
            $(window).on('hashchange.' + this.name, function(e) {
                e.preventDefault();
                self.handle_location_hash_change();
            });
        },

        handle_location_hash_change: function() {

            var self = this;

            $('[data-' + this.name + ']', this.scope).each(function() {
                var settings = $(this).data(self.name + '-init');
                if (settings.deep_linking) {
                    // Match the location hash to a label
                    var hash;
                    if (settings.scroll_to_content) {
                        hash = self.scope.location.hash;
                    } else {
                        // prefix the hash to prevent anchor scrolling
                        hash = self.scope.location.hash.replace('mob-', '');
                    }
                    if (hash != '') {
                        // Check whether the location hash references a tab content div or
                        // another element on the page (inside or outside the tab content div)
                        var hash_element = $(hash);
                        if (hash_element.hasClass(settings.panel_class) && hash_element.parent().hasClass(settings.content_class)) {
                            // Tab content div
                            self.toggle_active_tab($('[data-' + self.name + '] > * > a[href=' + hash + ']').parent());
                        } else {
                            // Not the tab content div. If inside the tab content, find the
                            // containing tab and toggle it as active.
                            var hash_tab_container_id = hash_element.closest('.' + settings.panel_class).attr('id');
                            if (hash_tab_container_id != undefined) {
                                self.toggle_active_tab($('[data-' + self.name + '] > * > a[href=#' + hash_tab_container_id + ']').parent(), hash);
                            }
                        }
                    } else {
                        // Reference the default tab hashes which were initialized in the init function
                        for (var ind = 0; ind < self.default_tab_hashes.length; ind++) {
                            self.toggle_active_tab($('[data-' + self.name + '] > * > a[href=' + self.default_tab_hashes[ind] + ']').parent());
                        }
                    }
                }
            });
        },

        toggle_active_tab: function(tab, location_hash) {
            var self = this,
                tabs = tab.closest('[data-' + this.name + ']'),
                tab_link = tab.find('a'),
                anchor = tab_link.first(),
                target_hash = '#' + anchor.attr('href').split('#')[1],
                target = $(target_hash),
                siblings = tab.siblings(),
                settings = tabs.data(this.name + '-init'),
                go_to_hash = function(hash) {
                    // This function allows correct behaviour of the browser's back button when deep linking is enabled. Without it
                    // the user would get continually redirected to the default hash.
                    var is_entry_location = window.location.href === self.entry_location,
                        default_hash = settings.scroll_to_content ? self.default_tab_hashes[0] : is_entry_location ? window.location.hash : 'mob-' + self.default_tab_hashes[0].replace('#', '');

                    if (!(is_entry_location && hash === default_hash)) {
                        window.location.hash = hash;
                    }
                };

            // allow usage of data-tab-content attribute instead of href
            if (anchor.data('tab-content')) {
                target_hash = '#' + anchor.data('tab-content').split('#')[1];
                target = $(target_hash);
            }

            if (settings.deep_linking) {

                if (settings.scroll_to_content) {

                    // retain current hash to scroll to content
                    go_to_hash(location_hash || target_hash);

                    if (location_hash == undefined || location_hash == target_hash) {
                        tab.parent()[0].scrollIntoView();
                    } else {
                        $(target_hash)[0].scrollIntoView();
                    }
                } else {
                    // prefix the hashes so that the browser doesn't scroll down
                    if (location_hash != undefined) {
                        go_to_hash('mob-' + location_hash.replace('#', ''));
                    } else {
                        go_to_hash('mob-' + target_hash.replace('#', ''));
                    }
                }
            }

            // WARNING: The activation and deactivation of the tab content must
            // occur after the deep linking in order to properly refresh the browser window.
            // Clean up multiple attr instances to done once
            tab.addClass(settings.active_class).triggerHandler('opened.' + this.name);
            tab_link.attr('aria-selected', 'true');
            siblings.removeClass(settings.active_class);
            siblings.find('a').attr('aria-selected', 'false');
            target.siblings().removeClass(settings.active_class).attr('aria-hidden', 'true');
            target.addClass(settings.active_class).attr('aria-hidden', 'false');
            settings.callback(tab);
            target.triggerHandler('toggled.' + this.name, [target]);
            tabs.triggerHandler('toggled.' + this.name, [tab]);
        },

        off: function() {},

        reflow: function() {}
    };
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.tips = {
        name: 'tips',

        settings: {
            // to display the massage text and so on
            content: '',
            // disappear after how many milliseconds.
            delay: 3000,
            // controll the tips' style.
            type: 'pop',
            // show on init
            show: false,
            // extra class
            class: '',
            // relative positioning of element.
            relativeTo: document.body,
            // background overlay element.
            has_overlay: false,
            overlay_class: 'overlay'
        },

        effect: {
            pop: {
                in: 'slide-in-down',
                out: 'slide-out-up',
                speed: 'fast'
            },
            msg: {
                in: 'pulse',
                out: 'zoom-out',
                speed: 'faster'
            },
            slide: {
                in: 'slide-in-up',
                out: 'slide-out-down',
                speed: 'fast'
            },
            overlay: {
                in: 'fade-in',
                out: 'fade-out',
                speed: 'normal'
            }
        },

        init: function(scope, method, options) {
            this.bindings(method, options);
            this.settings.show && this.show();
        },

        events: function() {
            var self = this;
            var attr = 'data-' + this.name;
            $(this.scope)
                .off('click.' + this.name)
                .on('click.' + this.name, '[' + attr + ']', function(e) {
                    e.preventDefault();

                    var content = $(this).attr(attr + '-content');
                    var type = $(this).attr(attr);

                    self.show(content, type);
                });
        },

        create: function(content, type) {
            var tipTpl = '<div class="' + type + 'tip ' + this.settings.class + '">' +
                '<div class="content animated">' +
                content +
                '</div>' +
            '</div>';
            this.element = $(tipTpl).appendTo(document.body);

            if(this.settings.has_overlay) {
                var overlayTpl = '<div class="' + this.settings.overlay_class + ' animated"></div>';
                this.overlay = $(overlayTpl).appendTo(document.body);
            }
        },

        show: function(content, type) {
            content = content || this.settings.content;
            type = type || this.settings.type;

            clearTimeout(this.timer);
            this.destroy();
            this.create(content, type);

            // if(!this.element) this.create(content, type);
            // else {
            //     this.element
            //         .off('animationend webkitAnimationEnd')
            //         .find('.content')
            //             .html(content);

            //     if(this.overlay) this.overlay.off('animationend webkitAnimationEnd');
            // }

            if(type === 'pop' && this.settings.relativeTo) {
                this.element.css('top', $(this.settings.relativeTo).offset().top);
            }

            type = this.effect[type];
            this.element
                .show()
                .trigger('show.' + this.name)
                .find('.content')
                .addClass(type.speed)
                .removeClass(type.out)
                .addClass(type.in);

            if(this.overlay) {
                this.overlay
                    .show()
                    .trigger('show.overlay')
                    .removeClass(this.effect.overlay.out)
                    .addClass(this.effect.overlay.in);
            }

            if (this.settings.delay) {
                this.timer = setTimeout($.proxy(function() {
                    this.hide(type);
                }, this), this.settings.delay);
            }
        },

        hide: function(type) {
            var self = this;
            type = type || this.effect[this.settings.type];

            this.element
                .trigger('hide.' + this.name)
                .find('.content')
                .removeClass(type.in)
                .addClass(type.out)
                .one('animationend webkitAnimationEnd', function() {
                    self.destroy();
                });
            if(this.overlay) {
                this.overlay
                    .trigger('hide.overlay')
                    .removeClass(this.effect.overlay.in)
                    .addClass(this.effect.overlay.out)
                    .one('animationend webkitAnimationEnd', function() {
                        $(this).remove();
                        self.overlay = null;
                    });
            }
        },

        destroy: function () {
            if(this.element) {
                this.element
                    .off('animationend webkitAnimationEnd')
                    .remove();
                this.element = null;
            }
            return this;
        },

        reflow: function() {}
    };
})(jQuery, window, window.document);

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.topbar = {
        name: 'topbar',

        settings: {
            sticky_class: 'sticky',
            start_offset: 0,
            is_hover: true
        },

        init: function(section, method, options) {
            Mobile.inherit(this, 'add_custom_rule');
            var self = this;

            this.bindings(method, options);

            $('[data-' + this.name + ']', this.scope).each(function() {
                var topbar = $(this),
                    topbarContainer = topbar.parent(),
                    maxHeight = Math.max(topbarContainer.outerHeight(), topbar.outerHeight()),
                    settings = topbar.data(self.name + '-init');
                if (topbarContainer.hasClass('fixed')) {
                    if (topbarContainer.hasClass('bottom')) {
                        $('body').css('padding-bottom', maxHeight);
                    }
                    else {
                        $('body').css('padding-top', maxHeight);
                    }
                    return;
                }

                if (self.stickable(topbarContainer, settings)) {
                    self.settings.sticky_class = settings.sticky_class;
                    self.settings.sticky_topbar = topbar;
                    topbar.data('height', topbarContainer.outerHeight(true));
                    topbar.data('stickyOffset', topbarContainer.offset().top);

                    if (!settings.sticked) {
                        settings.start_offset && topbarContainer.css('top', settings.start_offset);
                        self.sticked(topbar);

                        // Pad body when sticky (scrolled) or fixed.
                        self.add_custom_rule('.act-topbar-fixed { padding-top: ' + topbar.data('height') + 'px; }');
                    }
                }

            });

        },

        stickable: function(topbarContainer, settings) {
            return topbarContainer.hasClass(settings.sticky_class);
        },

        timer: null,

        events: function(bar) {
            var self = this;

            $(this.scope)
                .off('.' + this.name)
                .on('click.' + this.name + ' contextmenu.' + this.name, '.top-bar .top-bar-section li a[href^="#"],[data-' + this.name + '] .top-bar-section li a[href^="#"]', function(e) {
                    var li = $(this).closest('li'),
                        topbar = li.closest('[data-' + self.name + ']'),
                        settings = topbar.data(self.name + '-init');

                    if (settings.is_hover) {
                        var hoverLi = $(this).closest('.hover');
                        hoverLi.removeClass('hover');
                    }
                });

            $(window).off('.' + this.name)
                .on('resize.' + this.name, this.resize())
                .trigger('resize.' + this.name)
                .load(function() {
                    // Ensure that the offset is calculated after all of the pages resources have loaded
                    $(this).trigger('resize.' + this.name);
                });

            $('body').off('.' + this.name).on('click.' + this.name, function(e) {
                var parent = $(e.target).closest('li').closest('li.hover');

                if (parent.length > 0) {
                    return;
                }

                $('[data-' + self.name + '] li.hover').removeClass('hover');
            });

            // Show dropdown menus when their items are focused
            $(this.scope).find('.dropdown a')
                .focus(function() {
                    $(this).parents('.has-dropdown').addClass('hover');
                })
                .blur(function() {
                    $(this).parents('.has-dropdown').removeClass('hover');
                });
        },

        resize: function() {
            var self = this;
            $('[data-' + this.name + ']').each(function() {
                var topbar = $(this),
                    settings = topbar.data(self.name + '-init');

                var stickyContainer = topbar.parent('.' + self.settings.sticky_class);
                var stickyOffset;

                if (self.stickable(stickyContainer, self.settings)) {
                    if (stickyContainer.hasClass('fixed')) {
                        // Remove the fixed to allow for correct calculation of the offset.
                        stickyContainer.removeClass('fixed');

                        stickyOffset = stickyContainer.offset().top;
                        if ($(document.body).hasClass('act-topbar-fixed')) {
                            stickyOffset -= topbar.data('height');
                        }

                        topbar.data('stickyOffset', stickyOffset);
                        stickyContainer.addClass('fixed');
                    } else {
                        stickyOffset = stickyContainer.offset().top;
                        topbar.data('stickyOffset', stickyOffset);
                    }
                }

            });
        },

        sticked: function(topbar) {
            // check for sticky
            this.sticky(topbar.parent());

            topbar.data(this.name, $.extend({}, topbar.data(this.name), {
                sticked: true
            }));
        },

        sticky: function(element) {
            var self = this;

            $(window).on('scroll', function() {
                if(!self.supportSticky(element)) {
                    self.update_sticky_positioning();
                }
                self.changeStatus(element, 'sticking');
            });
        },

        changeStatus: function(element, className) {
            var stickier = this.settings.sticky_topbar;
            if(stickier) {
                if (this.isSticky(stickier)) {
                    element.addClass(className);
                }
                else {
                    element.removeClass(className);
                }
            }
        },

        isSticky: function(element) {
            var $window = $(window),
                distance = element.data('stickyOffset') - this.settings.start_offset;
            return $window.scrollTop() > distance;
        },

        supportSticky: function(element) {
            var dom = document.createElement('test');
            dom.style.position = '-webkit-sticky';
            dom.style.position = 'sticky';
            return /sticky/.test(dom.style.position) && ['visible', ''].indexOf($(element).parent().css('overflow')) > -1;
        },

        update_sticky_positioning: function() {
            var klass = '.' + this.settings.sticky_class,
                stickier = this.settings.sticky_topbar;

            if (stickier && this.stickable(stickier.parent(), this.settings)) {
                if (this.isSticky(stickier)) {
                    if (!$(klass).hasClass('fixed')) {
                        $(klass).addClass('fixed');
                        $('body').addClass('act-topbar-fixed');
                    }
                } else {
                    if ($(klass).hasClass('fixed')) {
                        $(klass).removeClass('fixed');
                        $('body').removeClass('act-topbar-fixed');
                    }
                }
            }
        },

        off: function() {
            $(this.scope).off('.topbar');
            $(window).off('.topbar');
        },

        reflow: function() {}
    };
}(jQuery, window, window.document));

(function($, window, document, undefined) {
    'use strict';

    Mobile.libs.validator = {
        name: 'validator',

        data_attr: function() {
            return 'data-' + this.name;
        },

        settings: {
            validate_on: 'manual', // change (when input value changes), blur (when input blur), manual (when call custom events)
            exception: ':hidden, [data-validator-ignore]', // ignore validate with 'exception' setting
            focus_on_invalid: false, // automatically bring the focus to an invalid input field
            has_hint: true, // popup a alert window if invalid
            error_labels: true, // labels with a for="inputId" will receive an `error` class
            error_class: 'has-error', // labels with a for="inputId" will receive an `error` class
            feedback: '.form-row', // support a parent(s) selector for feedback an error message box
            alert_element: '.alert-box', // for an error message box class
            isAjax: false, // You can set ajax mode
            preventDefault: false,
            // the amount of time Validator will take before it validates the form (in ms).
            // smaller time will result in faster validation
            timeout: 1000,
            patterns: {
                alpha: /^[a-zA-Z]*$/,
                digital: /^\d*$/,
                alpha_digital: /^[a-zA-Z\d]*$/,
                words: /^\w*$/,
                int: /^[-+]?\d*$/,
                positive: /^\+?\d*(?:[\.]\d+)?$/,
                negative: /^-\d*(?:[\.]\d+)?$/,
                number: /^[-+]?\d*(?:[\.]\d+)?$/,
                mobile: /^0?(?:1(?:[38]\d)|(?:4[579])|(?:[57][0-35-9]))\d{8}$/,
                tel: /^(0\d{2,3}-?)?[2-9]\d{5,7}(-\d{1,5})?$/,
                zip: /^\d{6}$/,
                // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
                email: /^[\w.!#$%&'*+\/=?^`{|}~-]+@[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?(?:\.[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?)*$/,
                // http://blogs.lse.ac.uk/lti/2008/04/23/a-regular-expression-to-match-any-url/
                url: /^(?:(https?|ftp|file|ssh):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z\d\.]+)+:?(\d+)?((\/[-\+~%\/\.\w]+)?\??([-\+=&;%@\.\w]+)?#?([\w]+)?)?)?$/,
                // abc.de
                domain: /^([a-zA-Z\d]([a-zA-Z\d\-]{0,61}[a-zA-Z\d])?\.)+[a-zA-Z]{2,8}$/,
                datetime: /^([0-2]\d{3})\-([0-1]\d)\-([0-3]\d)\s([0-2]\d):([0-5]\d):([0-5]\d)([-+]([0-1]\d)\:00)?$/,
                // YYYY-MM-DD
                date: /(?:19|20)\d{2}[-/.](?:(?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|1\d|2\d)|(?:(?!02)(?:0?[1-9]|1[0-2])[-/.](?:30))|(?:(?:0?[13578]|1[02])[-/.]31))$/,
                // HH:MM:SS
                time: /^(0?\d|1\d|2[0-3])(:[0-5]\d){2}$/,
                // #FFF or #FFFFFF
                color: /^#([a-fA-F\d]{6}|[a-fA-F\d]{3})$/
            },
            verifiers: {
                requiredone: function(el, required, parent) {
                    return !!$(el).closest('[' + this.data_attr() + ']').find('input[type="' + el.type + '"][name="' + el.name + '"]:checked:not(:disabled)').length;
                },
                equalto: function(el, required, parent) {
                    var from = document.querySelector(el.getAttribute(this.data_attr() + '-equalto'));

                    return from && (from.value === el.value);

                },
                oneof: function(el, required, parent) {
                    var els = document.querySelectorAll(el.getAttribute(this.data_attr() + '-oneof'));
                    return this.valid_oneof(els, required, parent);
                }
            },
            alerts: {
                required: '请{how}{placeholder}！',
                alpha: '请填写英文字母！',
                digital: '只允许填写数字！',
                alpha_digital: '请填写英文字母或数字！',
                words: '请输入英文字母、数字、下划线！',
                int: '请填写整数！',
                positive: '请填写正数！',
                negative: '请填写负数！',
                number: '请填写数值！',
                mobile: '手机号码有误，请重新填写！',
                tel: '电话号码有误，请重新填写!',
                zip: '邮政编码格式有误，请重新填写！',
                email: '请填写正确的邮箱地址！',
                url: '请填写正确的 URL 地址！',
                domain: '请填写正确的域名！',
                datetime: '请填写正确的日期和时间格式！',
                date: '请填写正确的日期格式！',
                time: '请填写正确的时间格式！',
                color: '请填写十六进制颜色格式！'
            }
        },

        timer: null,

        init: function(scope, method) {
            this.bindings(method, Array.prototype.slice.call(arguments, 2));
        },

        events: function(scope) {
            var self = this,
                form = $(scope).attr('novalidate', true),
                settings = form.data(this.name + '-init') || {};

            this.invalid_attr = 'data-invalid';

            function validate(el, originalSelf, e) {
                clearTimeout(self.timer);
                self.timer = setTimeout(function() {
                    self.validate(el, [].concat(originalSelf), e);
                }.bind(originalSelf), settings.timeout);
            }

            form
                .off('.' + this.name)
                .on('submit.' + this.name, function(e) {
                    var $this = $(this),
                        is_ajax = $this.data(self.name) === 'ajax' || self.settings.isAjax;

                    return self.validate($this, $this.find('input, textarea, select, [' + self.data_attr() +  '-verifier]').not(settings.exception).get(), e, is_ajax);
                })
                .on('validate.' + this.name, function(e) {
                    if (settings.validate_on === 'manual') {
                        self.validate($(this), [e.target], e);
                    }
                })
                .on('reset.' + this.name, function(e) {
                    return self.reset($(this), e);
                })
                .find('input, textarea, select').not(settings.exception)
                .off('.' + this.name)
                .on('change.' + this.name + ' blur.' + this.name, function(e) {
                    var id = this.id,
                        $this = $(this),
                        parent = $this.closest('[' + self.data_attr() + ']'),
                        oneOf = parent.find('[' + self.data_attr() +  '-oneof]').filter(function() {
                            if (parent.find($(this).data(self.name + '-oneof')).get().indexOf($this[0]) > -1) return this;
                        })[0];

                    if (oneOf) {
                        validate(parent, oneOf, e);
                    }

                    if (settings.validate_on === e.type) {
                        validate(parent, this, e);
                    }
                });
            // Not compatible, so commet it for a while
            // .on('focus.' + this.name, function(e) {
            //     if (navigator.userAgent.match(/iPad|iPhone|Android|BlackBerry|Windows Phone|webOS/i)) {
            //         $('html, body').animate({
            //             scrollTop: $(e.target).offset().top
            //         }, 100);
            //     }
            // });
        },

        reset: function(form, e) {
            form.removeAttr(this.invalid_attr);
            var settings = form.data(this.name + '-init') || {};

            $('[' + this.invalid_attr + ']', form).removeAttr(this.invalid_attr);
            $('.' + settings.error_class, form).not(settings.alert_element).removeClass(settings.error_class);
            $(':input', form).not(':radio, :checkbox, :button, :submit, :reset,' + settings.exception).val('').removeAttr(this.invalid_attr);
            $('input:radio, input:checkbox', form).prop('checked', false).removeAttr(this.invalid_attr);
        },

        disabledSubmit: function(form) {
            form.find('button[type=submit]').prop('disabled', true);
            $('[form="' + form.attr('id') + '"]').prop('disabled', true).addClass('disabled');
        },

        enabledSubmit: function(form) {
            form.find('button[type=submit]').prop('disabled', false);
            $('[form="' + form.attr('id') + '"]').prop('disabled', false).removeClass('disabled');
        },

        validate: function(form, els, e, is_ajax) {
            var self = this,
                validations = this.parse_patterns(form, els),
                validation_count = validations.length,
                submit_event = /submit/i.test(e.type);

            // Has to count up to make sure the focus gets applied to the top error
            for (var i = 0; i < validation_count; i++) {
                if (!validations[i] && (submit_event || is_ajax)) {
                    if (this.settings.focus_on_invalid) {
                        els[i].focus();
                    }
                    form.trigger('invalid.' + this.name, [e]).attr(this.invalid_attr, '');
                    this.enabledSubmit(form);
                    return false;
                }
            }

            if (submit_event || is_ajax) {
                if (this.settings.preventDefault) e.preventDefault();
                this.disabledSubmit(form);
                form.trigger('valid.' + this.name, [e]);
            }

            form.removeAttr(this.invalid_attr);

            if (is_ajax) {
                $.ajax({
                    url: form.attr('action'),
                    type: form.attr('method'),
                    data: form.serialize(),
                    dataType: 'json',
                    beforeSend: function() {
                        return form.trigger('start.ajax.' + this.name, arguments);
                    }
                })
                    .always(function() {
                        form.trigger('complete.ajax.' + this.name, arguments);
                        self.enabledSubmit(form);
                    })
                    .done(function() {
                        form.trigger('success.ajax.' + this.name, arguments);
                    })
                    .fail(function() {
                        form.trigger('error.ajax.' + this.name, arguments);
                    });
                return false;
            }

            return true;
        },

        parse_patterns: function(form, els) {
            var i = els.length,
                el_valid,
                el_patterns = [];

            while (i--) {
                el_valid = this.pattern(els[i]);
                el_valid && el_patterns.push(el_valid);
            }

            if (el_patterns.length) {
                el_patterns = this.check_validation(form, el_patterns);
            }

            return el_patterns;
        },

        pattern: function(el) {
            var type = el.type,
                required = el.hasAttribute('required'),
                pattern = el.getAttribute('pattern'),
                verifier = el.getAttribute(this.data_attr() + '-verifier') || '',
                eqTo = el.hasAttribute(this.data_attr() + '-equalto'),
                oneOf = el.hasAttribute(this.data_attr() + '-oneof'),
                patternKey = null,
                patternVal = null;

            if(required && !el.value.trim().length) {
                patternKey = 'required';
            } else if (this.settings.patterns.hasOwnProperty(pattern)) {
                patternKey = pattern;
                patternVal = this.settings.patterns[pattern];
            } else if (this.settings.patterns.hasOwnProperty(type)) {
                patternKey = type;
                patternVal = this.settings.patterns[type];
            } else if (this.settings.patterns.hasOwnProperty(verifier)) {
                patternKey = verifier;
                patternVal = this.settings.verifiers[verifier];
            } else if (pattern) {
                patternVal = new RegExp('^' + pattern.replace(/^\^(.+)\$$/, '$1') + '$');
            } else if (eqTo || oneOf) {
                patternKey = eqTo ? 'equalto' : 'oneof';
                patternVal = /^.*$/;
            }

            if (patternKey || patternVal || required) {
                return [el, patternKey, patternVal, required];
            }
        },

        // TODO: Break this up into smaller methods, getting hard to read.
        check_validation: function(form, el_patterns) {
            var i = el_patterns.length,
                validations = [],
                settings = form.data(this.name + '-init') || {};

            while (i--) {
                var el = el_patterns[i][0],
                    pattern = el_patterns[i][2],
                    required = el_patterns[i][3],
                    value = el.value.trim(),
                    is_checkable = ['radio', 'checkbox'].indexOf(el.type) > -1,
                    direct_parent = $(el).parent(),
                    parent = settings.feedback ? $(el).parents(settings.feedback) : null,
                    verifier = el.getAttribute(this.data_attr() + '-verifier'),
                    // Validate using each of the specified (space-delimited) verifiers.
                    verifiers = verifier ? verifier.split(' ') : [],
                    label = (function() {
                        var label = [];
                        if (direct_parent.is('label')) {
                            label = direct_parent;
                        } else if (parent.length) {
                            label = parent.find('label');
                        }
                        if (!label.length) {
                            label = $('label[for="' + el.id + '"]');
                        }

                        return label;
                    })(),
                    el_validations = [],
                    valid,
                    last_valid = true,
                    all_valid = true;

                if (el.disabled) continue;

                if (is_checkable && required) {
                    verifiers.push('requiredone');
                }
                // support old way to do equalTo validations
                if (el.getAttribute(this.data_attr() + '-equalto')) {
                    verifiers.push('equalto');
                }
                if (el.getAttribute(this.data_attr() + '-oneof')) {
                    verifiers.push('oneof');
                }

                if (!parent.length) {
                    parent = direct_parent;
                }
                if (parent.is('label')) {
                    parent = parent.parent();
                }

                if (required) {
                    valid = value.length;
                    el_validations.push(valid);
                    if (valid) {
                        this.validSuccess(el, parent, label);
                    }
                    else {
                        // el_patterns[i][1] = 'required';
                        validations = this.validError(el, parent, label, el_patterns[i], el_validations);
                        if(validations.length) break;
                    }
                }
                if (verifiers.length) {
                    for (var iv = 0; iv < verifiers.length; iv++) {
                        valid = this.settings.verifiers[verifiers[iv]].apply(this, [el, required, parent]);
                        el_validations.push(valid);
                        all_valid = valid && last_valid;
                        last_valid = valid;
                    }
                    if (all_valid) {
                        this.validSuccess(el, parent, label);
                    } else {
                        validations = this.validError(el, parent, label, el_patterns[i], el_validations);
                        if(validations.length) break;
                    }
                } else if(pattern) {
                    if ($.type(pattern) == 'function') {
                        valid = pattern(el, required, parent);
                    } else if ($.type(pattern) == 'regexp') {
                        valid = pattern.test(value);
                    }
                    if (!value.length) {
                        valid = el.checkValidity();
                    }

                    el_validations.push(valid);

                    // el_validations = [el_validations.every(function(valid) {
                    //     return valid;
                    // })];
                    if (valid) {
                        this.validSuccess(el, parent, label);
                    } else {
                        validations = this.validError(el, parent, label, el_patterns[i], el_validations);
                        if(validations.length) break;
                    }
                }
                validations = validations.concat(el_validations);
            }

            return validations;
        },

        validSuccess: function(el, parent, label) {
            el.removeAttribute(this.invalid_attr);
            el.setAttribute('aria-invalid', 'false');
            el.removeAttribute('aria-describedby');
            parent.removeClass(this.settings.error_class);
            if (label.length > 0 && this.settings.error_labels) {
                label.removeClass(this.settings.error_class).removeAttr('role');
            }
            $(el).triggerHandler('valid');
        },

        validError: function(el, parent, label, el_patterns, el_validations) {
            var validations = [];
            el.setAttribute(this.invalid_attr, '');
            el.setAttribute('aria-invalid', 'true');

            // Try to find the error associated with the input
            var required = el_patterns[3];
            var errorElement = parent.find(this.settings.alert_element);
            var msg = el_patterns[0].dataset.alerts || this.settings.alerts[el_patterns[1]] || '输入不符合要求，请检查！';

            if(required) {
                var how = '输入';
                if (['radio', 'checked'].indexOf(el.type) > -1 || el.tagName === 'select') {
                    how = '选择';
                }
                msg = msg.replace('{how}', how).replace('{placeholder}', label.length ? label.text().replace(/[：:*]\s*$/g, '').trim() : el_patterns[0].placeholder || '其中一项');
            }

            if (!errorElement.length) {
                if(this.settings.has_hint) {
                    alert(msg);
                    $(el).triggerHandler('invalid');
                    return validations.concat(el_validations);
                }
            } else {
                // errorElement.html(msg);
                var errorID = errorElement.attr('id');
                if (errorID) {
                    el.setAttribute('aria-describedby', errorID);
                }
            }

            // el.setAttribute('aria-describedby', $(el).find('.error')[0].id);
            parent.addClass(this.settings.error_class);
            if (label.length > 0 && this.settings.error_labels) {
                label.addClass(this.settings.error_class).attr('role', 'alert');
            }
            $(el).triggerHandler('invalid');

            return validations;
        },

        valid_oneof: function(el, required, parent, doNotValidateOthers) {
            var el = $(el),
                valid = el.filter(function() {
                    return ['radio', 'checkbox'].indexOf(this.type) > -1 ? this.checked : !!this.value.trim().length;
                }).length > 0;

            if (valid) {
                el.removeAttr(this.invalid_attr);
                parent.removeClass(this.settings.error_class);
            } else {
                el.attr(this.invalid_attr, '');
                parent.addClass(this.settings.error_class);
            }

            if (!doNotValidateOthers) {
                var _this = this;
                el.each(function() {
                    _this.valid_oneof.call(_this, this, null, parent, true);
                });
            }

            return valid;
        },

        reflow: function(scope, options) {
            var self = this,
                form = $('[' + this.data_attr() + ']'); //.attr('novalidate', 'novalidate');
            form.each(function() {
                self.events(this);
            });
        }
    };
}(jQuery, window, window.document));
