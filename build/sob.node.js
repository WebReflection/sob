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
//! (C) Andrea Giammarchi @WebReflection - MIT Style License
var
  requestAnimationFrame = global.requestAnimationFrame ||
                          global.webkitRequestAnimationFrame ||
                          global.mozRequestAnimationFrame ||
                          function (fn) {
                            setTimeout(fn, 16);
                          },
  requestIdleCallback = global.requestIdleCallback,
  NO_IDLE = !requestIdleCallback,
  performance = global.performance || {now: Date.now},
  now = (performance.now || performance.webkitNow || function () {
    return (new Date()).getTime();
  }),
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
  compareValue = function compareValue(value, i) {
    return value === this[i];
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
  drop = function drop(queue, id) {
    var
      i = findIndex(queue, id),
      found = -1 < i
    ;
    if (found) queue.splice(i, 1);
    return found;
  },
  previousLength = 0,
  qframe = [],
  qidle = [],
  next = {
    debug: false,
    isOverloaded: false,
    minFPS: 60,
    clear: function clear(id) {
      if (!drop(qframe, id)) drop(qidle, id);
    },
    frame: function frame() {
      return create.apply(qframe, arguments);
    },
    idle: function idle() {
      return create.apply(qidle, arguments);
    }
  }
;

(function animationLoop() {
  var
    t = now.call(performance),
    fps = 1000 / next.minFPS,
    overTime = false,
    info
  ;
  while (qframe.length) {
    exec(qframe.shift());
    overTime = (now.call(performance) - t) >= fps;
    if (overTime) break;
  }
  if (NO_IDLE && !overTime && qidle.length) {
    exec(qidle.shift());
  }
  next.isOverloaded = qframe.length > previousLength;
  previousLength = qframe.length;
  if (next.debug && next.isOverloaded)
    console.warn('overloaded frame');
  requestAnimationFrame(animationLoop);
}());

if (!NO_IDLE) (function idleLoop() {
  var
    t = now.call(performance),
    fps = 1000 / next.minFPS,
    info
  ;
  while (qidle.length) {
    exec(qidle.shift());
    if ((now.call(performance) - t) >= fps) break;
  }
  requestIdleCallback(idleLoop);
}());
module.exports = next;