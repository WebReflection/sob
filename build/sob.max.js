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
//! (C) Andrea Giammarchi @WebReflection - MIT Style License
var
  // local shams
  performance = global.performance || {now: Date.now},
  now = (
    performance.now ||
    performance.webkitNow ||
    function now() {
      return (new Date()).getTime();
    }
  ),
  requestAnimationFrame = global.requestAnimationFrame ||
                          global.webkitRequestAnimationFrame ||
                          global.mozRequestAnimationFrame ||
                          function (fn) { setTimeout(fn, 16); },
  requestIdleCallback = global.requestIdleCallback,
  // CONSTANTS
  NO_IDLE = !requestIdleCallback,
  // local helpers
  compareValue = function compareValue(value, i) {
    return value === this[i];
  },
  create = function create(callback) {
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
  },
  drop = function drop(queue, id) {
    var
      i = findIndex(queue, id),
      found = -1 < i
    ;
    if (found) queue.splice(i, 1);
    return found;
  },
  exec = function exec(info) {
    info.fn.apply(null, info.ar);
  },
  findIndex = function findIndex(queue, id) {
    var i = queue.length;
    while (i-- && queue[i].id !== id);
    return i;
  },
  infoId = function infoId(queue, info) {
    for (var i = 0, tmp; i < queue.length; i++) {
      tmp = queue[i];
      if (
        tmp.fn === info.fn &&
        tmp.ar.length === info.ar.length &&
        tmp.ar.every(compareValue, info.ar)
      ) return tmp.id;
    }
    return null;
  },
  runIfNeeded = function () {
    if (!frameRunning) {
      frameRunning = true;
      requestAnimationFrame(animationLoop);
    }
  },
  // exported module
  next = {
    // if true, shows "frame overload" when it happens
    debug: false,
    // when operations slow down FPS is true
    isOverloaded: false,
    // minimum accepted FPS (suggested range 20 to 60)
    minFPS: 60,
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
      runIfNeeded();
      return create.apply(qframe, arguments);
    },
    // schedule a callback for the next idle callback
    // returns its unique id as object
    // .idle(callback[, arg0, arg1, argN]):object
    idle: function idle() {
      if (NO_IDLE) {
        runIfNeeded();
      } else if (!idleRunning) {
        idleRunning = true;
        requestIdleCallback(idleLoop);
      }
      return create.apply(qidle, arguments);
    }
  },
  // local variables
  // rAF and rIC states
  frameRunning = false,
  idleRunning = false,
  // previous rAF length
  previousLength = 0,
  // animation frame and idle queues
  qframe = [],
  qidle = [],
  // animation frame and idle execution queues
  qframex = [],
  qidlex = []
;

// responsible for centralized requestAnimationFrame operations
function animationLoop() {
  var
    // grab current time
    t = now.call(performance),
    // calculate how many millisends we have
    fps = 1000 / next.minFPS,
    // used to flag overtime in case we exceed milliseconds
    overTime = false,
    // take current frame queue length
    // if previous call didn't execute all callbacks
    length = qframex.length ?
      // reprioritize the queue putting those in front
      qframe.unshift.apply(qframe, qframex) :
      qframe.length
  ;
  // if there is actually something to do
  if (length || (NO_IDLE && qidle.length)) {
    // reschedule upfront next animation frame
    requestAnimationFrame(animationLoop);
    // this prevents the need for a try/catch within the while loop
    // reassign qframex cleaning current animation frame queue
    qframex = qframe.splice(0, length);
    // try to execute all of them
    while (length--) {
      // if some of them fails, it's OK
      // next round will re-prioritize the animation frame queue
      exec(qframex.shift());
      // store eventual overtime info
      overTime = (now.call(performance) - t) >= fps;
      // if we exceeded the frame time, get out this loop
      if (overTime) break;
    }
    // update the current frame queue length
    length += 1 + qframe.length;
    // flag eventually the isOverloaded info
    next.isOverloaded = overTime || length > previousLength;
    // update the previous length info
    previousLength = length;
    // if debug is true and there is an overload, warn it
    if (next.debug && next.isOverloaded) console.warn('overloaded frame');
    // if the browser has no idle callback and there's no overload
    // execute one callback of the idle queue
    if (NO_IDLE && !overTime && qidle.length) exec(qidle.shift());
  } else {
    // all frame callbacks have been executed
    // we can actually stop asking for animation frames
    frameRunning = false;
    // and flag it as non busy/overloaded anymore
    next.isOverloaded = frameRunning;
  }
}

// responsible for centralized requestIdleCallback operations
function idleLoop() {
  var
    // grab current time
    t = now.call(performance),
    // calculate how many millisends we have
    fps = 1000 / next.minFPS,
    // take current idle queue length
    // if previous call didn't execute all callbacks
    length = qidlex.length ?
      // reprioritize the queue putting those in front
      qidle.unshift.apply(qidle, qidlex) :
      qidle.length
  ;
  // if there is actually something to do
  if (length) {
    // reschedule upfront next idle callback
    requestIdleCallback(idleLoop);
    // this prevents the need for a try/catch within the while loop
    // reassign qidlex cleaning current idle queue
    qidlex = qidle.splice(0, length);
    // try to execute all of them
    while (length--) {
      // if some of them fails, it's OK
      // next round will re-prioritize the idle queue
      exec(qidlex.shift());
      // if we exceeded the frame time, get out this loop
      if ((now.call(performance) - t) >= fps) break;
    }
  } else {
    // all idle callbacks have been executed
    // we can actually stop asking for idle operations
    idleRunning = false;
  }
}

return next;

}(window));