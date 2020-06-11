(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue'], factory) :
  (global = global || self, factory(global.Duex = {}, global.Vue));
}(this, (function (exports, Vue) { 'use strict';

  Vue = Vue && Object.prototype.hasOwnProperty.call(Vue, 'default') ? Vue['default'] : Vue;

  var LIBRARY = require('./_library');
  var global = require('./_global');
  var ctx = require('./_ctx');
  var classof = require('./_classof');
  var $export = require('./_export');
  var isObject = require('./_is-object');
  var aFunction = require('./_a-function');
  var anInstance = require('./_an-instance');
  var forOf = require('./_for-of');
  var speciesConstructor = require('./_species-constructor');
  var task = require('./_task').set;
  var microtask = require('./_microtask')();
  var newPromiseCapabilityModule = require('./_new-promise-capability');
  var perform = require('./_perform');
  var userAgent = require('./_user-agent');
  var promiseResolve = require('./_promise-resolve');
  var PROMISE = 'Promise';
  var TypeError$1 = global.TypeError;
  var process$1 = global.process;
  var versions = process$1 && process$1.versions;
  var v8 = versions && versions.v8 || '';
  var $Promise = global[PROMISE];
  var isNode = classof(process$1) == 'process';
  var empty = function () { /* empty */ };
  var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
  var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

  var USE_NATIVE = !!function () {
    try {
      // correct subclassing with @@species support
      var promise = $Promise.resolve(1);
      var FakePromise = (promise.constructor = {})[require('./_wks')('species')] = function (exec) {
        exec(empty, empty);
      };
      // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
      return (isNode || typeof PromiseRejectionEvent == 'function')
        && promise.then(empty) instanceof FakePromise
        // v8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
        // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
        // we can't detect it synchronously, so just check versions
        && v8.indexOf('6.6') !== 0
        && userAgent.indexOf('Chrome/66') === -1;
    } catch (e) { /* empty */ }
  }();

  // helpers
  var isThenable = function (it) {
    var then;
    return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
  };
  var notify = function (promise, isReject) {
    if (promise._n) return;
    promise._n = true;
    var chain = promise._c;
    microtask(function () {
      var value = promise._v;
      var ok = promise._s == 1;
      var i = 0;
      var run = function (reaction) {
        var handler = ok ? reaction.ok : reaction.fail;
        var resolve = reaction.resolve;
        var reject = reaction.reject;
        var domain = reaction.domain;
        var result, then, exited;
        try {
          if (handler) {
            if (!ok) {
              if (promise._h == 2) onHandleUnhandled(promise);
              promise._h = 1;
            }
            if (handler === true) result = value;
            else {
              if (domain) domain.enter();
              result = handler(value); // may throw
              if (domain) {
                domain.exit();
                exited = true;
              }
            }
            if (result === reaction.promise) {
              reject(TypeError$1('Promise-chain cycle'));
            } else if (then = isThenable(result)) {
              then.call(result, resolve, reject);
            } else resolve(result);
          } else reject(value);
        } catch (e) {
          if (domain && !exited) domain.exit();
          reject(e);
        }
      };
      while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
      promise._c = [];
      promise._n = false;
      if (isReject && !promise._h) onUnhandled(promise);
    });
  };
  var onUnhandled = function (promise) {
    task.call(global, function () {
      var value = promise._v;
      var unhandled = isUnhandled(promise);
      var result, handler, console;
      if (unhandled) {
        result = perform(function () {
          if (isNode) {
            process$1.emit('unhandledRejection', value, promise);
          } else if (handler = global.onunhandledrejection) {
            handler({ promise: promise, reason: value });
          } else if ((console = global.console) && console.error) {
            console.error('Unhandled promise rejection', value);
          }
        });
        // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
        promise._h = isNode || isUnhandled(promise) ? 2 : 1;
      } promise._a = undefined;
      if (unhandled && result.e) throw result.v;
    });
  };
  var isUnhandled = function (promise) {
    return promise._h !== 1 && (promise._a || promise._c).length === 0;
  };
  var onHandleUnhandled = function (promise) {
    task.call(global, function () {
      var handler;
      if (isNode) {
        process$1.emit('rejectionHandled', promise);
      } else if (handler = global.onrejectionhandled) {
        handler({ promise: promise, reason: promise._v });
      }
    });
  };
  var $reject = function (value) {
    var promise = this;
    if (promise._d) return;
    promise._d = true;
    promise = promise._w || promise; // unwrap
    promise._v = value;
    promise._s = 2;
    if (!promise._a) promise._a = promise._c.slice();
    notify(promise, true);
  };
  var $resolve = function (value) {
    var promise = this;
    var then;
    if (promise._d) return;
    promise._d = true;
    promise = promise._w || promise; // unwrap
    try {
      if (promise === value) throw TypeError$1("Promise can't be resolved itself");
      if (then = isThenable(value)) {
        microtask(function () {
          var wrapper = { _w: promise, _d: false }; // wrap
          try {
            then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
          } catch (e) {
            $reject.call(wrapper, e);
          }
        });
      } else {
        promise._v = value;
        promise._s = 1;
        notify(promise, false);
      }
    } catch (e) {
      $reject.call({ _w: promise, _d: false }, e); // wrap
    }
  };

  // constructor polyfill
  if (!USE_NATIVE) {
    // 25.4.3.1 Promise(executor)
    $Promise = function Promise(executor) {
      anInstance(this, $Promise, PROMISE, '_h');
      aFunction(executor);
      Internal.call(this);
      try {
        executor(ctx($resolve, this, 1), ctx($reject, this, 1));
      } catch (err) {
        $reject.call(this, err);
      }
    };
    // eslint-disable-next-line no-unused-vars
    Internal = function Promise(executor) {
      this._c = [];             // <- awaiting reactions
      this._a = undefined;      // <- checked in isUnhandled reactions
      this._s = 0;              // <- state
      this._d = false;          // <- done
      this._v = undefined;      // <- value
      this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
      this._n = false;          // <- notify
    };
    Internal.prototype = require('./_redefine-all')($Promise.prototype, {
      // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
      then: function then(onFulfilled, onRejected) {
        var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
        reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
        reaction.fail = typeof onRejected == 'function' && onRejected;
        reaction.domain = isNode ? process$1.domain : undefined;
        this._c.push(reaction);
        if (this._a) this._a.push(reaction);
        if (this._s) notify(this, false);
        return reaction.promise;
      },
      // 25.4.5.1 Promise.prototype.catch(onRejected)
      'catch': function (onRejected) {
        return this.then(undefined, onRejected);
      }
    });
    OwnPromiseCapability = function () {
      var promise = new Internal();
      this.promise = promise;
      this.resolve = ctx($resolve, promise, 1);
      this.reject = ctx($reject, promise, 1);
    };
    newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
      return C === $Promise || C === Wrapper
        ? new OwnPromiseCapability(C)
        : newGenericPromiseCapability(C);
    };
  }

  $export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
  require('./_set-to-string-tag')($Promise, PROMISE);
  require('./_set-species')(PROMISE);
  Wrapper = require('./_core')[PROMISE];

  // statics
  $export($export.S + $export.F * !USE_NATIVE, PROMISE, {
    // 25.4.4.5 Promise.reject(r)
    reject: function reject(r) {
      var capability = newPromiseCapability(this);
      var $$reject = capability.reject;
      $$reject(r);
      return capability.promise;
    }
  });
  $export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
    // 25.4.4.6 Promise.resolve(x)
    resolve: function resolve(x) {
      return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);
    }
  });
  $export($export.S + $export.F * !(USE_NATIVE && require('./_iter-detect')(function (iter) {
    $Promise.all(iter)['catch'](empty);
  })), PROMISE, {
    // 25.4.4.1 Promise.all(iterable)
    all: function all(iterable) {
      var C = this;
      var capability = newPromiseCapability(C);
      var resolve = capability.resolve;
      var reject = capability.reject;
      var result = perform(function () {
        var values = [];
        var index = 0;
        var remaining = 1;
        forOf(iterable, false, function (promise) {
          var $index = index++;
          var alreadyCalled = false;
          values.push(undefined);
          remaining++;
          C.resolve(promise).then(function (value) {
            if (alreadyCalled) return;
            alreadyCalled = true;
            values[$index] = value;
            --remaining || resolve(values);
          }, reject);
        });
        --remaining || resolve(values);
      });
      if (result.e) reject(result.v);
      return capability.promise;
    },
    // 25.4.4.4 Promise.race(iterable)
    race: function race(iterable) {
      var C = this;
      var capability = newPromiseCapability(C);
      var reject = capability.reject;
      var result = perform(function () {
        forOf(iterable, false, function (promise) {
          C.resolve(promise).then(capability.resolve, reject);
        });
      });
      if (result.e) reject(result.v);
      return capability.promise;
    }
  });

  // 19.1.3.6 Object.prototype.toString()
  var classof$1 = require('./_classof');
  var test = {};
  test[require('./_wks')('toStringTag')] = 'z';
  if (test + '' != '[object z]') {
    require('./_redefine')(Object.prototype, 'toString', function toString() {
      return '[object ' + classof$1(this) + ']';
    }, true);
  }

  // 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
  var $export$1 = require('./_export');

  $export$1($export$1.P, 'Function', { bind: require('./_bind') });

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

  var $export$2 = require('./_export');
  var $indexOf = require('./_array-includes')(false);
  var $native = [].indexOf;
  var NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

  $export$2($export$2.P + $export$2.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
    // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
    indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
      return NEGATIVE_ZERO
        // convert -0 to +0
        ? $native.apply(this, arguments) || 0
        : $indexOf(this, searchElement, arguments[1]);
    }
  });

  var $export$3 = require('./_export');
  var $forEach = require('./_array-methods')(0);
  var STRICT = require('./_strict-method')([].forEach, true);

  $export$3($export$3.P + $export$3.F * !STRICT, 'Array', {
    // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
    forEach: function forEach(callbackfn /* , thisArg */) {
      return $forEach(this, callbackfn, arguments[1]);
    }
  });

  var $iterators = require('./es6.array.iterator');
  var getKeys = require('./_object-keys');
  var redefine = require('./_redefine');
  var global$1 = require('./_global');
  var hide = require('./_hide');
  var Iterators = require('./_iterators');
  var wks = require('./_wks');
  var ITERATOR = wks('iterator');
  var TO_STRING_TAG = wks('toStringTag');
  var ArrayValues = Iterators.Array;

  var DOMIterables = {
    CSSRuleList: true, // TODO: Not spec compliant, should be false.
    CSSStyleDeclaration: false,
    CSSValueList: false,
    ClientRectList: false,
    DOMRectList: false,
    DOMStringList: false,
    DOMTokenList: true,
    DataTransferItemList: false,
    FileList: false,
    HTMLAllCollection: false,
    HTMLCollection: false,
    HTMLFormElement: false,
    HTMLSelectElement: false,
    MediaList: true, // TODO: Not spec compliant, should be false.
    MimeTypeArray: false,
    NamedNodeMap: false,
    NodeList: true,
    PaintRequestList: false,
    Plugin: false,
    PluginArray: false,
    SVGLengthList: false,
    SVGNumberList: false,
    SVGPathSegList: false,
    SVGPointList: false,
    SVGStringList: false,
    SVGTransformList: false,
    SourceBufferList: false,
    StyleSheetList: true, // TODO: Not spec compliant, should be false.
    TextTrackCueList: false,
    TextTrackList: false,
    TouchList: false
  };

  for (var collections = getKeys(DOMIterables), i = 0; i < collections.length; i++) {
    var NAME = collections[i];
    var explicit = DOMIterables[NAME];
    var Collection = global$1[NAME];
    var proto = Collection && Collection.prototype;
    var key;
    if (proto) {
      if (!proto[ITERATOR]) hide(proto, ITERATOR, ArrayValues);
      if (!proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
      Iterators[NAME] = ArrayValues;
      if (explicit) for (key in $iterators) if (!proto[key]) redefine(proto, key, $iterators[key], true);
    }
  }

  var addToUnscopables = require('./_add-to-unscopables');
  var step = require('./_iter-step');
  var Iterators$1 = require('./_iterators');
  var toIObject = require('./_to-iobject');

  // 22.1.3.4 Array.prototype.entries()
  // 22.1.3.13 Array.prototype.keys()
  // 22.1.3.29 Array.prototype.values()
  // 22.1.3.30 Array.prototype[@@iterator]()
  module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
    this._t = toIObject(iterated); // target
    this._i = 0;                   // next index
    this._k = kind;                // kind
  // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
  }, function () {
    var O = this._t;
    var kind = this._k;
    var index = this._i++;
    if (!O || index >= O.length) {
      this._t = undefined;
      return step(1);
    }
    if (kind == 'keys') return step(0, index);
    if (kind == 'values') return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'values');

  // argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
  Iterators$1.Arguments = Iterators$1.Array;

  addToUnscopables('keys');
  addToUnscopables('values');
  addToUnscopables('entries');

  // 19.1.2.14 Object.keys(O)
  var toObject = require('./_to-object');
  var $keys = require('./_object-keys');

  require('./_object-sap')('keys', function () {
    return function keys(it) {
      return $keys(toObject(it));
    };
  });

  var $export$4 = require('./_export');
  var $map = require('./_array-methods')(1);

  $export$4($export$4.P + $export$4.F * !require('./_strict-method')([].map, true), 'Array', {
    // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
    map: function map(callbackfn /* , thisArg */) {
      return $map(this, callbackfn, arguments[1]);
    }
  });

  // 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
  var $export$5 = require('./_export');

  $export$5($export$5.S, 'Array', { isArray: require('./_is-array') });

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
