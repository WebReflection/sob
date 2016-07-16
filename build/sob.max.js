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
var sob = (function (global) {
//! (C) Andrea Giammarchi @WebReflection - MIT Style License
var
  requestAnimationFrame = global.requestAnimationFrame ||
                          global.webkitRequestAnimationFrame ||
                          global.mozRequestAnimationFrame ||
                          function (fn) { setTimeout(fn, 16); },
  requestIdleCallback = global.requestIdleCallback,
  NO_IDLE = !requestIdleCallback,
  performance = global.performance || {now: Date.now},
  now = (
    performance.now ||
    performance.webkitNow ||
    function now() {
      return (new Date()).getTime();
    }
  ),
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
  next = {
    debug: false,
    isOverloaded: false,
    minFPS: 60,
    clear: function clear(id) {
      void(
        drop(qframe, id) ||
        drop(qidle, id) ||
        drop(qframex, id) ||
        drop(qidlex, id)
      );
    },
    frame: function frame() {
      runIfNeeded();
      return create.apply(qframe, arguments);
    },
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
  frameRunning = false,
  idleRunning = false,
  previousLength = 0,
  qframe = [],
  qidle = [],
  qframex = [],
  qidlex = [],
  runIfNeeded = function () {
    if (!frameRunning) {
      frameRunning = true;
      requestAnimationFrame(animationLoop);
    }
  }
;

function animationLoop() {
  var
    t = now.call(performance),
    fps = 1000 / next.minFPS,
    overTime = false
  ;
  qframex = qframe.splice(0, qframe.length);
  while (qframex.length) {
    exec(qframex.shift());
    overTime = (now.call(performance) - t) >= fps;
    if (overTime) break;
  }
  if (qframex.length) qframe.unshift.apply(qframe, qframex);
  next.isOverloaded = qframe.length > previousLength;
  previousLength = qframe.length;
  if (NO_IDLE && !overTime && qidle.length) exec(qidle.shift());
  if (next.debug && next.isOverloaded)
    console.warn('overloaded frame');
  if (qframe.length || (NO_IDLE && qidle.length)) {
    requestAnimationFrame(animationLoop);
  } else {
    frameRunning = false;
    next.isOverloaded = frameRunning;
  }
}

function idleLoop() {
  var
    t = now.call(performance),
    fps = 1000 / next.minFPS
  ;
  qidlex = qidle.splice(0, qidle.length);
  while (qidlex.length) {
    exec(qidlex.shift());
    if ((now.call(performance) - t) >= fps) break;
  }
  if (qidlex.length) qidle.unshift.apply(qidle, qidlex);
  if (qidle.length) requestIdleCallback(idleLoop);
  else idleRunning = false;
}
return next;

}(window));