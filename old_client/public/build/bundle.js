
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Player\Player.svelte generated by Svelte v3.32.3 */

    const file = "src\\components\\Player\\Player.svelte";

    function create_fragment(ctx) {
    	let div8;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let p0;
    	let abbr;
    	let t2;
    	let t3;
    	let h2;
    	let t5;
    	let p1;
    	let t7;
    	let div7;
    	let div3;
    	let div2;
    	let t8;
    	let div6;
    	let div4;
    	let t10;
    	let div5;
    	let t12;
    	let div9;
    	let button0;
    	let svg0;
    	let path0;
    	let t13;
    	let button1;
    	let svg1;
    	let path1;
    	let t14;
    	let button2;
    	let svg2;
    	let path2;
    	let path3;
    	let path4;
    	let t15;
    	let button3;
    	let svg3;
    	let circle;
    	let path5;
    	let t16;
    	let button4;
    	let svg4;
    	let path6;
    	let path7;
    	let path8;
    	let t17;
    	let button5;
    	let svg5;
    	let path9;
    	let path10;
    	let t18;
    	let button6;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			abbr = element("abbr");
    			abbr.textContent = "Ep.";
    			t2 = text(" 128");
    			t3 = space();
    			h2 = element("h2");
    			h2.textContent = "Scaling CSS at Heroku with Utility Classes";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Full Stack Radio";
    			t7 = space();
    			div7 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			t8 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div4.textContent = "24:16";
    			t10 = space();
    			div5 = element("div");
    			div5.textContent = "75:50";
    			t12 = space();
    			div9 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t13 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t14 = space();
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			t15 = space();
    			button3 = element("button");
    			svg3 = svg_element("svg");
    			circle = svg_element("circle");
    			path5 = svg_element("path");
    			t16 = space();
    			button4 = element("button");
    			svg4 = svg_element("svg");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			t17 = space();
    			button5 = element("button");
    			svg5 = svg_element("svg");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			t18 = space();
    			button6 = element("button");
    			button6.textContent = "1.0x";
    			if (img.src !== (img_src_value = "/full-stack-radio.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "width", "160");
    			attr_dev(img, "height", "160");
    			attr_dev(img, "class", "flex-none w-20 h-20 rounded-lg bg-gray-100");
    			add_location(img, file, 2, 4, 250);
    			attr_dev(abbr, "title", "Episode");
    			add_location(abbr, file, 5, 8, 548);
    			attr_dev(p0, "class", "text-lime-600 dark:text-lime-400 text-sm sm:text-base lg:text-sm xl:text-base font-semibold uppercase");
    			add_location(p0, file, 4, 6, 425);
    			attr_dev(h2, "class", "text-black dark:text-white text-base sm:text-xl lg:text-base xl:text-xl font-semibold truncate");
    			add_location(h2, file, 7, 6, 604);
    			attr_dev(p1, "class", "text-gray-500 dark:text-gray-400 text-base sm:text-lg lg:text-base xl:text-lg font-medium");
    			add_location(p1, file, 10, 6, 784);
    			attr_dev(div0, "class", "min-w-0 flex-auto space-y-0.5");
    			add_location(div0, file, 3, 4, 374);
    			attr_dev(div1, "class", "flex items-center space-x-3.5 sm:space-x-5 lg:space-x-3.5 xl:space-x-5");
    			add_location(div1, file, 1, 2, 160);
    			attr_dev(div2, "class", "bg-lime-500 dark:bg-lime-400 w-1/2 h-1.5");
    			attr_dev(div2, "role", "progressbar");
    			attr_dev(div2, "aria-valuenow", "1456");
    			attr_dev(div2, "aria-valuemin", "0");
    			attr_dev(div2, "aria-valuemax", "4550");
    			add_location(div2, file, 17, 6, 1054);
    			attr_dev(div3, "class", "bg-gray-200 dark:bg-black rounded-full overflow-hidden");
    			add_location(div3, file, 16, 4, 978);
    			add_location(div4, file, 20, 6, 1319);
    			add_location(div5, file, 21, 6, 1343);
    			attr_dev(div6, "class", "text-gray-500 dark:text-gray-400 flex justify-between text-sm font-medium tabular-nums");
    			add_location(div6, file, 19, 4, 1211);
    			attr_dev(div7, "class", "space-y-2");
    			add_location(div7, file, 15, 2, 949);
    			attr_dev(div8, "class", "bg-white dark:bg-gray-800 rounded-tl-xl sm:rounded-t-xl p-4 pb-6 sm:p-8 lg:p-4 lg:pb-6 xl:p-8 space-y-6 sm:space-y-8 lg:space-y-6 xl:space-y-8");
    			add_location(div8, file, 0, 0, 0);
    			attr_dev(path0, "d", "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z");
    			attr_dev(path0, "stroke", "currentColor");
    			attr_dev(path0, "stroke-width", "1.5");
    			attr_dev(path0, "stroke-linecap", "round");
    			add_location(path0, file, 28, 6, 1680);
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "fill", "none");
    			add_location(svg0, file, 27, 4, 1632);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "mx-auto");
    			add_location(button0, file, 26, 2, 1588);
    			attr_dev(path1, "d", "M0 0h2v18H0V0zM4 9l13-9v18L4 9z");
    			attr_dev(path1, "fill", "currentColor");
    			add_location(path1, file, 33, 6, 1950);
    			attr_dev(svg1, "width", "17");
    			attr_dev(svg1, "height", "18");
    			add_location(svg1, file, 32, 4, 1914);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "hidden sm:block lg:hidden xl:block mx-auto");
    			add_location(button1, file, 31, 2, 1835);
    			attr_dev(path2, "d", "M12.878 26.12c1.781 0 3.09-1.066 3.085-2.515.004-1.104-.665-1.896-1.824-2.075v-.068c.912-.235 1.505-.95 1.5-1.93.005-1.283-1.048-2.379-2.727-2.379-1.602 0-2.89.968-2.932 2.387h1.274c.03-.801.784-1.287 1.64-1.287.892 0 1.475.541 1.471 1.346.004.844-.673 1.398-1.64 1.398h-.738v1.074h.737c1.21 0 1.91.614 1.91 1.491 0 .848-.738 1.424-1.765 1.424-.946 0-1.683-.486-1.734-1.262H9.797c.055 1.424 1.317 2.395 3.08 2.395zm7.734.025c2.016 0 3.196-1.645 3.196-4.504 0-2.838-1.197-4.488-3.196-4.488-2.003 0-3.196 1.645-3.2 4.488 0 2.855 1.18 4.5 3.2 4.504zm0-1.138c-1.18 0-1.892-1.185-1.892-3.366.004-2.174.716-3.371 1.892-3.371 1.172 0 1.888 1.197 1.888 3.37 0 2.182-.712 3.367-1.888 3.367z");
    			attr_dev(path2, "fill", "currentColor");
    			add_location(path2, file, 38, 6, 2135);
    			attr_dev(path3, "d", "M1 22c0 8.837 7.163 16 16 16s16-7.163 16-16S25.837 6 17 6");
    			attr_dev(path3, "stroke", "currentColor");
    			attr_dev(path3, "stroke-width", "1.5");
    			add_location(path3, file, 39, 6, 2857);
    			attr_dev(path4, "d", "M17 0L9 6l8 6V0z");
    			attr_dev(path4, "fill", "currentColor");
    			add_location(path4, file, 40, 6, 2976);
    			attr_dev(svg2, "width", "34");
    			attr_dev(svg2, "height", "39");
    			attr_dev(svg2, "fill", "none");
    			add_location(svg2, file, 37, 4, 2087);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "mx-auto");
    			add_location(button2, file, 36, 2, 2043);
    			attr_dev(circle, "class", "text-gray-300 dark:text-gray-500");
    			attr_dev(circle, "cx", "25");
    			attr_dev(circle, "cy", "25");
    			attr_dev(circle, "r", "24");
    			attr_dev(circle, "stroke", "currentColor");
    			attr_dev(circle, "stroke-width", "1.5");
    			add_location(circle, file, 45, 6, 3146);
    			attr_dev(path5, "d", "M18 16h4v18h-4V16zM28 16h4v18h-4z");
    			attr_dev(path5, "fill", "currentColor");
    			add_location(path5, file, 46, 6, 3269);
    			attr_dev(svg3, "width", "50");
    			attr_dev(svg3, "height", "50");
    			attr_dev(svg3, "fill", "none");
    			add_location(svg3, file, 44, 4, 3098);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "mx-auto");
    			add_location(button3, file, 43, 2, 3054);
    			attr_dev(path6, "d", "M12.878 26.12c1.781 0 3.09-1.066 3.085-2.515.004-1.104-.665-1.896-1.824-2.075v-.068c.912-.235 1.505-.95 1.5-1.93.005-1.283-1.048-2.379-2.727-2.379-1.602 0-2.89.968-2.932 2.387h1.274c.03-.801.784-1.287 1.64-1.287.892 0 1.475.541 1.471 1.346.004.844-.673 1.398-1.64 1.398h-.738v1.074h.737c1.21 0 1.91.614 1.91 1.491 0 .848-.738 1.424-1.765 1.424-.946 0-1.683-.486-1.734-1.262H9.797c.055 1.424 1.317 2.395 3.08 2.395zm7.734.025c2.016 0 3.196-1.645 3.196-4.504 0-2.838-1.197-4.488-3.196-4.488-2.003 0-3.196 1.645-3.2 4.488 0 2.855 1.18 4.5 3.2 4.504zm0-1.138c-1.18 0-1.892-1.185-1.892-3.366.004-2.174.716-3.371 1.892-3.371 1.172 0 1.888 1.197 1.888 3.37 0 2.182-.712 3.367-1.888 3.367z");
    			attr_dev(path6, "fill", "currentColor");
    			add_location(path6, file, 51, 6, 3456);
    			attr_dev(path7, "d", "M33 22c0 8.837-7.163 16-16 16S1 30.837 1 22 8.163 6 17 6");
    			attr_dev(path7, "stroke", "currentColor");
    			attr_dev(path7, "stroke-width", "1.5");
    			add_location(path7, file, 52, 6, 4178);
    			attr_dev(path8, "d", "M17 0l8 6-8 6V0z");
    			attr_dev(path8, "fill", "currentColor");
    			add_location(path8, file, 53, 6, 4296);
    			attr_dev(svg4, "width", "34");
    			attr_dev(svg4, "height", "39");
    			attr_dev(svg4, "fill", "none");
    			add_location(svg4, file, 50, 4, 3408);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "mx-auto");
    			add_location(button4, file, 49, 2, 3364);
    			attr_dev(path9, "d", "M17 0H15V18H17V0Z");
    			attr_dev(path9, "fill", "currentColor");
    			add_location(path9, file, 58, 6, 4521);
    			attr_dev(path10, "d", "M13 9L0 0V18L13 9Z");
    			attr_dev(path10, "fill", "currentColor");
    			add_location(path10, file, 59, 6, 4579);
    			attr_dev(svg5, "width", "17");
    			attr_dev(svg5, "height", "18");
    			attr_dev(svg5, "viewBox", "0 0 17 18");
    			attr_dev(svg5, "fill", "none");
    			add_location(svg5, file, 57, 4, 4453);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "hidden sm:block lg:hidden xl:block mx-auto");
    			add_location(button5, file, 56, 2, 4374);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "mx-auto border border-gray-300 rounded-md text-sm font-medium py-0.5 px-2 text-gray-500 dark:border-gray-600 dark:text-gray-400");
    			add_location(button6, file, 62, 2, 4659);
    			attr_dev(div9, "class", "bg-gray-50 text-black dark:bg-gray-900 dark:text-white lg:rounded-b-xl py-4 px-1 sm:px-3 lg:px-1 xl:px-3 grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-5 xl:grid-cols-7 items-center");
    			add_location(div9, file, 25, 0, 1391);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, abbr);
    			append_dev(p0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, h2);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, div3);
    			append_dev(div3, div2);
    			append_dev(div7, t8);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div9, t13);
    			append_dev(div9, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div9, t14);
    			append_dev(div9, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path2);
    			append_dev(svg2, path3);
    			append_dev(svg2, path4);
    			append_dev(div9, t15);
    			append_dev(div9, button3);
    			append_dev(button3, svg3);
    			append_dev(svg3, circle);
    			append_dev(svg3, path5);
    			append_dev(div9, t16);
    			append_dev(div9, button4);
    			append_dev(button4, svg4);
    			append_dev(svg4, path6);
    			append_dev(svg4, path7);
    			append_dev(svg4, path8);
    			append_dev(div9, t17);
    			append_dev(div9, button5);
    			append_dev(button5, svg5);
    			append_dev(svg5, path9);
    			append_dev(svg5, path10);
    			append_dev(div9, t18);
    			append_dev(div9, button6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div9);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Player", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var Theme;
    (function (Theme) {
        Theme[Theme["SystemPref"] = 0] = "SystemPref";
        Theme[Theme["Light"] = 1] = "Light";
        Theme[Theme["Dark"] = 2] = "Dark";
    })(Theme || (Theme = {}));

    var _a;
    const currentTheme = writable((_a = localStorage.theme) !== null && _a !== void 0 ? _a : Theme.Dark);
    const changeTheme = (theme) => {
        localStorage.theme = theme;
        // Whenever the user explicitly chooses to respect the OS preference
        // localStorage.removeItem('theme')
        // On page load or when changing themes, best to add inline in `head` to avoid FOUC
        if (theme === Theme.Dark || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    };
    currentTheme.subscribe(changeTheme);

    /* src\components\Menu\Settings.svelte generated by Svelte v3.32.3 */
    const file$1 = "src\\components\\Menu\\Settings.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let label;
    	let input;
    	let t;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t = space();
    			span = element("span");
    			attr_dev(input, "type", "checkbox");
    			input.checked = true;
    			attr_dev(input, "class", "svelte-10exkz9");
    			add_location(input, file$1, 10, 4, 321);
    			attr_dev(span, "class", "slider round svelte-10exkz9");
    			add_location(span, file$1, 11, 4, 385);
    			attr_dev(label, "class", "switch svelte-10exkz9");
    			add_location(label, file$1, 9, 2, 293);
    			add_location(div, file$1, 8, 0, 284);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			append_dev(label, t);
    			append_dev(label, span);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*toggleDarkMode*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentTheme;
    	validate_store(currentTheme, "currentTheme");
    	component_subscribe($$self, currentTheme, $$value => $$invalidate(1, $currentTheme = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Settings", slots, []);

    	const toggleDarkMode = () => {
    		const isLightTheme = $currentTheme === Theme.Light;
    		currentTheme.set(isLightTheme ? Theme.Dark : Theme.Light);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		currentTheme,
    		Theme,
    		toggleDarkMode,
    		$currentTheme
    	});

    	return [toggleDarkMode];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\Layout.svelte generated by Svelte v3.32.3 */
    const file$2 = "src\\Layout.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let settings;
    	let t;
    	let player;
    	let current;
    	settings = new Settings({ $$inline: true });
    	player = new Player({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(settings.$$.fragment);
    			t = space();
    			create_component(player.$$.fragment);
    			add_location(div, file$2, 4, 0, 147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(settings, div, null);
    			append_dev(div, t);
    			mount_component(player, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(settings);
    			destroy_component(player);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Player, Settings });
    	return [];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.32.3 */
    const file$3 = "src\\App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let layout;
    	let current;
    	layout = new Layout({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(layout.$$.fragment);
    			add_location(main, file$3, 10, 0, 407);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(layout, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(layout);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	if (localStorage.theme === "dark" || !("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    		document.documentElement.classList.add("dark");
    	} else {
    		document.documentElement.classList.remove("dark");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Layout });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
