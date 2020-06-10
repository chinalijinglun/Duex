(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('core-js/modules/es6.promise'), require('core-js/modules/es6.object.to-string'), require('core-js/modules/es6.function.bind'), require('core-js/modules/es6.array.index-of'), require('core-js/modules/es6.array.for-each'), require('vue'), require('core-js/modules/web.dom.iterable'), require('core-js/modules/es6.array.iterator'), require('core-js/modules/es6.object.keys'), require('core-js/modules/es6.array.map'), require('core-js/modules/es6.array.is-array')) :
  typeof define === 'function' && define.amd ? define(['exports', 'core-js/modules/es6.promise', 'core-js/modules/es6.object.to-string', 'core-js/modules/es6.function.bind', 'core-js/modules/es6.array.index-of', 'core-js/modules/es6.array.for-each', 'vue', 'core-js/modules/web.dom.iterable', 'core-js/modules/es6.array.iterator', 'core-js/modules/es6.object.keys', 'core-js/modules/es6.array.map', 'core-js/modules/es6.array.is-array'], factory) :
  (global = global || self, factory(global.Duex = {}, null, null, null, null, null, global.Vue));
}(this, (function (exports, es6_promise, es6_object_toString, es6_function_bind, es6_array_indexOf, es6_array_forEach, Vue) { 'use strict';

  Vue = Vue && Object.prototype.hasOwnProperty.call(Vue, 'default') ? Vue['default'] : Vue;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it;

    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;

        var F = function () {};

        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var normalCompletion = true,
        didErr = false,
        err;
    return {
      s: function () {
        it = o[Symbol.iterator]();
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  function normalizeMap(map) {
    return Array.isArray(map) ? map.map(function (k) {
      return {
        k: k,
        v: k
      };
    }) : Object.keys(map).map(function (k) {
      return {
        k: k,
        v: map[k]
      };
    });
  }
  function resolveSource(source, type) {
    return typeof type === 'function' ? type : source[type];
  }

  var createMapState = function createMapState(_store) {
    return function (states) {
      var res = {};

      var _iterator = _createForOfIteratorHelper(normalizeMap(states)),
          _step;

      try {
        var _loop = function _loop() {
          var _step$value = _step.value,
              k = _step$value.k,
              v = _step$value.v;

          res[k] = function () {
            var store = _store || this.$store;
            return typeof v === 'function' ? v.call(this, store.state) : store.state[v];
          };
        };

        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          _loop();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return res;
    };
  };
  var mapToMethods = function mapToMethods(sourceName, runnerName, _store) {
    return function (map) {
      var res = {};

      var _iterator2 = _createForOfIteratorHelper(normalizeMap(map)),
          _step2;

      try {
        var _loop2 = function _loop2() {
          var _step2$value = _step2.value,
              k = _step2$value.k,
              v = _step2$value.v;

          res[k] = function (payload) {
            var store = _store || this.$store;
            var source = store[sourceName];
            var runner = store[runnerName];
            var actualSource = typeof v === 'function' ? v.call(this, source) : v;
            return runner.call(store, actualSource, payload);
          };
        };

        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          _loop2();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return res;
    };
  };

  var devtoolHook = typeof window !== 'undefined' && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
  function devtoolPlugin(store) {
    if (!devtoolHook) return;
    store._devtoolHook = devtoolHook;
    devtoolHook.emit('vuex:init', store);
    devtoolHook.on('vuex:travel-to-state', function (targetState) {
      store.replaceState(targetState);
    });
    store.subscribe(function (mutation, state) {
      devtoolHook.emit('vuex:mutation', mutation, state);
    });
  }

  var Store = /*#__PURE__*/function () {
    _createClass(Store, null, [{
      key: "install",
      value: function install(Vue) {
        Vue.mixin({
          beforeCreate: function beforeCreate() {
            this.$store = this.$options.store || this.$parent && this.$parent.$store;
          }
        });
      }
    }]);

    function Store() {
      var _this = this;

      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          state = _ref.state,
          _ref$mutations = _ref.mutations,
          mutations = _ref$mutations === void 0 ? {} : _ref$mutations,
          _ref$actions = _ref.actions,
          actions = _ref$actions === void 0 ? {} : _ref$actions,
          plugins = _ref.plugins,
          _ref$subscribers = _ref.subscribers,
          subscribers = _ref$subscribers === void 0 ? [] : _ref$subscribers;

      _classCallCheck(this, Store);

      this.vm = new Vue({
        data: {
          $$state: typeof state === 'function' ? state() : state
        }
      });
      this.mutations = mutations;
      this.actions = actions;
      this.subscribers = subscribers;

      if (plugins) {
        plugins.forEach(function (p) {
          return _this.use(p);
        });
      }

      if (Vue.config.devtools) {
        this.getters = []; // hack for vue-devtools

        devtoolPlugin(this);
      }

      this.mapState = createMapState(this);
      this.mapActions = mapToMethods('actions', 'dispatch', this);
      this.mapMutations = mapToMethods('mutations', 'commit', this);
    }

    _createClass(Store, [{
      key: "subscribe",
      value: function subscribe(sub) {
        var _this2 = this;

        this.subscribers.push(sub);
        return function () {
          return _this2.subscribers.splice(_this2.subscribers.indexOf(sub), 1);
        };
      }
    }, {
      key: "commit",
      value: function commit(type, payload) {
        var mutation = resolveSource(this.mutations, type);
        mutation && mutation(this.state, payload);

        var _iterator = _createForOfIteratorHelper(this.subscribers),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var sub = _step.value;
            sub({
              type: type,
              payload: payload
            }, this.state);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }, {
      key: "dispatch",
      value: function dispatch(type, payload) {
        var action = resolveSource(this.actions, type);
        var ctx = {
          dispatch: this.dispatch.bind(this),
          commit: this.commit.bind(this)
        };
        return Promise.resolve(action && action(ctx, payload));
      }
    }, {
      key: "use",
      value: function use(fn) {
        fn(this);
        return this;
      }
    }, {
      key: "replaceState",
      value: function replaceState(state) {
        this.vm.$data.$$state = state;
        return this;
      }
    }, {
      key: "state",
      get: function get() {
        return this.vm.$data.$$state;
      },
      set: function set(v) {
        if (process.env.NODE_ENV === 'development') {
          throw new Error('[puex] store.state is read-only, use store.replaceState(state) instead');
        }
      }
    }]);

    return Store;
  }();
  var mapState = createMapState();
  var mapActions = mapToMethods('actions', 'dispatch');
  var mapMutations = mapToMethods('mutations', 'commit');

  exports.default = Store;
  exports.mapActions = mapActions;
  exports.mapMutations = mapMutations;
  exports.mapState = mapState;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=Duex.js.map
