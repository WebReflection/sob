/*!
Copyright (C) 2016 by Andrea Giammarchi @WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
var sob = (function (global) {'use strict';
var
  // local shortcuts with shams
  performance = (
    global.performance ||
    {now: Date.now}
  ),
  now = (
    performance.now ||
    performance.webkitNow ||
    function now() { return (new Date()).getTime(); }
  ),
  max = Math.max,
  requestAnimationFrame = (
    global.requestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    function (fn) { setTimeout(fn, 16); }
  ),
  requestIdleCallback = (
    global.requestIdleCallback ||
    function (fn, options) {
      var
        // schedule timeout at least in the next frame
        fps = 1000 / next.minFPS,
        // grab shceduling time
        st = time(),
        t
      ;
      timeout(function () {
        // grab time before the next "tick"
        t = time();
        timeout(function () {
          fn({
            // when this happens, forces at least one task to be executed no matter what
            didTimeout: options.timeout < (time() - st),
            // returns how much time left
            timeRemaining: function () {
              return max(0, next.minFPS - (time() - t));
            }
          }, 1);
        });
      }, fps);
    }
  ),
  timeout = global.setTimeout,
  // exported module
  next = {
    // if true, shows "frame overload" when it happens
    debug: false,
    // when operations slow down FPS is true
    isOverloaded: false,
    // minimum accepted FPS (suggested range 20 to 60)
    minFPS: 60,
    // maximum delay per each requestIdleCallback operation
    maxIdle: 2000,
    // remove a scheduled frame or idle operation
    clear: function clear(id) {
      void(
        drop(qframe, id) ||
        drop(qidle, id) ||
        drop(qframex, id) ||
        drop(qidlex, id)
      );
    },
    // schedule a callback for the next frame
    // returns its unique id as object
    // .frame(callback[, arg0, arg1, argN]):object
    frame: function frame() {
      if (!frameRunning) {
        frameRunning = true;
        requestAnimationFrame(animationLoop);
      }
      return create.apply(qframe, arguments);
    },
    // schedule a callback for the next idle callback
    // returns its unique id as object
    // .idle(callback[, arg0, arg1, argN]):object
    idle: function idle() {
      if (!idleRunning) {
        idleRunning = true;
        requestIdleCallback(idleLoop, {timeout: next.maxIdle});
      }
      return create.apply(qidle, arguments);
    }
  },
  // local variables
  // rAF and rIC states
  frameRunning = false,
  idleRunning = false,
  // animation frame and idle queues
  qframe = [],
  qidle = [],
  // animation frame and idle execution queues
  qframex = [],
  qidlex = []
;

// asliases
next.raf = next.frame;
next.ric = next.idle;

// responsible for centralized requestAnimationFrame operations
function animationLoop() {
  var
    // grab current time
    t = time(),
    // calculate how many millisends we have
    fps = 1000 / next.minFPS,
    // used to flag overtime in case we exceed milliseconds
    overTime = false,
    // take current frame queue length
    length = getLength(qframe, qframex)
  ;
  // if there is actually something to do
  if (length) {
    // reschedule upfront next animation frame
    // this prevents the need for a try/catch within the while loop
    requestAnimationFrame(animationLoop);
    // reassign qframex cleaning current animation frame queue
    qframex = qframe.splice(0, length);
    while (qframex.length) {
      // if some of them fails, it's OK
      // next round will re-prioritize the animation frame queue
      exec(qframex.shift());
      // if we exceeded the frame time, get out this loop
      overTime = (time() - t) >= fps;
      if ((next.isOverloaded = overTime)) break;
    }
    // if overtime and debug is true, warn about it
    if (overTime && next.debug) console.warn('overloaded frame');
  } else {
    // all frame callbacks have been executed
    // we can actually stop asking for animation frames
    frameRunning = false;
    // and flag it as non busy/overloaded anymore
    next.isOverloaded = frameRunning;
  }
}

// create a unique id and returns it
// if the callback with same extra arguments
// was already scheduled, then returns same id
function create(callback) {
  /* jslint validthis: true */
  for (var
    queue = this,
    args = [],
    info = {
      id: {},
      fn: callback,
      ar: args
    },
    i = 1; i < arguments.length; i++
  ) args[i - 1] = arguments[i];
  return infoId(queue, info) || (queue.push(info), info.id);
}

// remove a scheduled id from a queue
function drop(queue, id) {
  var
    i = findIndex(queue, id),
    found = -1 < i
  ;
  if (found) queue.splice(i, 1);
  return found;
}

// execute a shceduled callback with optional args
function exec(info) {
  info.fn.apply(null, info.ar);
}

// find queue index by id
function findIndex(queue, id) {
  var i = queue.length;
  while (i-- && queue[i].id !== id);
  return i;
}

// return the right queue length to consider
// re-prioritizing scheduled callbacks
function getLength(queue, queuex) {
  // if previous call didn't execute all callbacks
  return queuex.length ?
    // reprioritize the queue putting those in front
    queue.unshift.apply(queue, queuex) :
    queue.length;
}

// responsible for centralized requestIdleCallback operations
function idleLoop(deadline) {
  var
    length = getLength(qidle, qidlex),
    didTimeout = deadline.didTimeout
  ;
  if (length) {
    // reschedule upfront next idle callback
    requestIdleCallback(idleLoop, {timeout: next.maxIdle});
    // this prevents the need for a try/catch within the while loop
    // reassign qidlex cleaning current idle queue
    qidlex = qidle.splice(0, didTimeout ? 1 : length);
    while (qidlex.length && (didTimeout || deadline.timeRemaining()))
      exec(qidlex.shift());
  } else {
    // all idle callbacks have been executed
    // we can actually stop asking for idle operations
    idleRunning = false;
  }
}

// return a scheduled unique id through similar info
function infoId(queue, info) {
  for (var i = 0, length = queue.length, tmp; i < length; i++) {
    tmp = queue[i];
    if (
      tmp.fn === info.fn &&
      sameValues(tmp.ar, info.ar)
    ) return tmp.id;
  }
  return null;
}

// compare two arrays values
function sameValues(a, b) {
  var
    i = a.length,
    j = b.length,
    k = i === j
  ;
  if (k) {
    while (i--) {
      if (a[i] !== b[i]) {
        return !k;
      }
    }
  }
  return k;
}

// return performance.now() real or sham value
function time() {
  return now.call(performance);
}

return next;

}(window));