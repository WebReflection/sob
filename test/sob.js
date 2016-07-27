//remove:
var next = require('../build/sob.node.js');
//:remove

wru.test([
  {
    name: "it's an obejct",
    test: function () {
      wru.assert(typeof sob == 'object');
    }
  }, {
    name: 'requestAnimationFrame',
    test: function () {
      sob.frame(wru.async(function () {
        wru.assert('requestAnimationFrame happened', true);
      }));
    }
  }, {
    name: 'requestIdleCallback',
    test: function () {
      sob.frame(wru.async(function () {
        wru.assert('requestIdleCallback happened', true);
      }));
    }
  }, {
    name: 'clear',
    test: function () {
      var
        animHappened = false,
        idleHappened = false,
        animId = sob.frame(function () {
          animHappened = true;
        }),
        idleId = sob.idle(function () {
          idleHappened = true;
        })
      ;
      sob.clear(animId);
      sob.clear(idleId);
      setTimeout(wru.async(function () {
        wru.assert(!animHappened && !idleHappened);
      }), 300);
    }
  }, {
    name: 'clear inverted',
    test: function () {
      var
        animHappened = false,
        idleHappened = false,
        animId = sob.frame(function () {
          animHappened = true;
        }),
        idleId = sob.idle(function () {
          idleHappened = true;
        })
      ;
      sob.clear(idleId);
      sob.clear(animId);
      setTimeout(wru.async(function () {
        wru.assert(!animHappened && !idleHappened);
      }), 300);
    }
  }, {
    name: 'no duplicated rAF',
    test: function () {
      var
        executed = [],
        first = function () {
          executed.push(first);
        },
        second = function () {
          executed.push(second);
        }
      ;
      sob.frame(first);
      sob.frame(first);
      sob.frame(second);
      sob.frame(first);
      sob.frame(second);
      sob.frame(second);
      sob.frame(first);
      setTimeout(wru.async(function () {
        wru.assert(
          executed.length === 2 &&
          executed[0] === first &&
          executed[1] === second
        );
      }), 300);
    }
  }, {
    name: 'no duplicated rIC',
    test: function () {
      var
        executed = [],
        first = function () {
          executed.push(first);
        },
        second = function () {
          executed.push(second);
        }
      ;
      sob.idle(first);
      sob.idle(first);
      sob.idle(second);
      sob.idle(first);
      sob.idle(second);
      sob.idle(second);
      sob.idle(first);
      setTimeout(wru.async(function () {
        wru.assert(
          executed.length === 2 &&
          executed[0] === first &&
          executed[1] === second
        );
      }), 300);
    }
  }, {
    name: 'passed arguments rAF',
    test: function () {
      var
        executed = [],
        first = function () {
          executed.push(arguments);
        },
        second = function () {
          executed.push(arguments);
        }
      ;
      sob.frame(first, 1, 2, 3);
      sob.frame(second, 4, 5, 6);
      setTimeout(wru.async(function () {
        wru.assert(
          [].join.call(executed[0]) === '1,2,3' &&
          [].join.call(executed[1]) === '4,5,6'
        );
      }), 300);
    }
  }, {
    name: 'passed arguments rIC',
    test: function () {
      var
        executed = [],
        first = function () {
          executed.push(arguments);
        },
        second = function () {
          executed.push(arguments);
        }
      ;
      sob.idle(first, 1, 2, 3);
      sob.idle(second, 4, 5);
      setTimeout(wru.async(function () {
        wru.assert(
          [].join.call(executed[0]) === '1,2,3' &&
          [].join.call(executed[1]) === '4,5'
        );
      }), 300);
    }
  }, {
    name: 'no duplicated rAF + args',
    test: function () {
      var
        executed = [],
        first = function first() {
          executed.push({
            fn: first,
            ar: [].slice.call(arguments)
          });
        },
        second = function second() {
          executed.push({
            fn: second,
            ar: [].slice.call(arguments)
          });
        }
      ;
      sob.frame(first, 1, 2, 3);
      sob.frame(first, 1, 2, 3);
      sob.frame(second, 4, 5);
      sob.frame(first, 1, 2, 3);
      sob.frame(second, 4, 5);
      sob.frame(second, 4, 5);
      sob.frame(first, 1, 2, 3);
      setTimeout(wru.async(function () {
        wru.assert(
          executed.length === 2 &&
          executed[0].fn === first &&
          executed[1].fn === second &&
          executed[0].ar.join(',') === '1,2,3' &&
          executed[1].ar.join(',') === '4,5'
        );
      }), 300);
    }
  }, {
    name: 'no duplicated rIC + args',
    test: function () {
      var
        executed = [],
        first = function first() {
          executed.push({
            fn: first,
            ar: [].slice.call(arguments)
          });
        },
        second = function second() {
          executed.push({
            fn: second,
            ar: [].slice.call(arguments)
          });
        }
      ;
      sob.idle(first, 1, 2, 3);
      sob.idle(first, 1, 2, 3);
      sob.idle(second, 4, 5);
      sob.idle(first, 1, 2, 3);
      sob.idle(second, 4, 5);
      sob.idle(second, 4, 5);
      sob.idle(first, 1, 2, 3);
      setTimeout(wru.async(function () {
        wru.assert(
          executed.length === 2 &&
          executed[0].fn === first &&
          executed[1].fn === second &&
          executed[0].ar.join(',') === '1,2,3' &&
          executed[1].ar.join(',') === '4,5'
        );
      }), 300);
    }
  }, {
    name: 'same callback, different rAF args',
    test: function () {
      var
        executed = [],
        first = function () {
          executed.push({
            fn: first,
            ar: [].slice.call(arguments)
          });
        },
        second = function () {
          executed.push({
            fn: second,
            ar: [].slice.call(arguments)
          });
        },
        ids = [
          sob.frame(first),
          sob.frame(first, 1),
          sob.frame(first, 1, 2),
          sob.frame(second),
          sob.frame(second, 1),
          sob.frame(first),
          sob.frame(first, 1),
          sob.frame(first, 1, 2),
          sob.frame(second),
          sob.frame(second, 1)
        ]
      ;
      sob.clear(ids[1]);
      sob.clear(ids[3]);
      setTimeout(wru.async(function () {
        wru.assert(
          executed.length === 3 &&
          executed[0].fn === first &&
          executed[1].fn === first &&
          executed[2].fn === second &&
          executed[0].ar.join(',') === '' &&
          executed[1].ar.join(',') === '1,2' &&
          executed[2].ar.join(',') === '1'
        );
      }), 300);
    }
  }, {
    name: 'same callback, different rIC args',
    test: function () {
      var
        executed = [],
        first = function () {
          executed.push({
            fn: first,
            ar: [].slice.call(arguments)
          });
        },
        second = function () {
          executed.push({
            fn: second,
            ar: [].slice.call(arguments)
          });
        },
        ids = [
          sob.idle(first),
          sob.idle(first, 1),
          sob.idle(first, 1, 2),
          sob.idle(second),
          sob.idle(second, 1),
          sob.idle(first),
          sob.idle(first, 1),
          sob.idle(first, 1, 2),
          sob.idle(second),
          sob.idle(second, 1)
        ]
      ;
      sob.clear(ids[1]);
      sob.clear(ids[3]);
      setTimeout(wru.async(function () {
        wru.assert(
          executed.length === 3 &&
          executed[0].fn === first &&
          executed[1].fn === first &&
          executed[2].fn === second &&
          executed[0].ar.join(',') === '' &&
          executed[1].ar.join(',') === '1,2' &&
          executed[2].ar.join(',') === '1'
        );
      }), 300);
    }
  }, {
    name: 'overload',
    test: function () {
      sob.frame(function () {
        var t = (new Date).getTime();
        while ((new Date).getTime() - t < (1000 / (sob.minFPS / 2)));
      });
      sob.frame(wru.async(function () {
        wru.assert(sob.isOverloaded);
      }));
    }
  }, {
    name: 'multiple calls',
    test: function () {
      var
        frame = 0,
        idle = 0,
        done = wru.async(function () {
          wru.assert(true);
        })
      ;
      (function f() {
        if (++frame >= 10 && idle === 10) done();
        else sob.frame(f);
      }());
      (function i() {
        if (++idle < 10) sob.idle(i);
      }());
    }
  }, {
    name: 'fail safe frame',
    test: function () {
      var calls = [];
      sob.frame(function a() { calls.push('a'); });
      sob.frame(function b() { throw new Error('b'); });
      sob.frame(function c() { calls.push('c'); });
      sob.frame(function d() { calls.push('d'); });
      sob.frame(wru.async(function () {
        wru.assert(calls.join(',') === 'a,c,d');
      }));
    }
  }, {
    name: 'fail safe idle',
    test: function () {
      var calls = [];
      sob.idle(function a() { calls.push('a'); });
      sob.idle(function b() { throw new Error('b'); });
      sob.idle(function c() { calls.push('c'); });
      sob.idle(function d() { calls.push('d'); });
      sob.idle(wru.async(function () {
        wru.assert(calls.join(',') === 'a,c,d');
      }));
    }
  }, {
    name: 'performance',
    test: function () {
      var
        counter = 0,
        id
      ;
      setTimeout(wru.async(function () {
        sob.clear(id);
        wru.assert('frames ' + counter, sob.minFPS <= counter);
      }), 1000);
      (function run() {
        counter++;
        id = sob.frame(run);
      }());
    }
  }
]);
