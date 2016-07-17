var
  // local shams
  performance = (
    global.performance ||
    {now: Date.now}
  ),
  now = (
    performance.now ||
    performance.webkitNow ||
    function now() { return (new Date()).getTime(); }
  ),
  requestAnimationFrame = (
    global.requestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    function (fn) { setTimeout(fn, 16); }
  ),
  requestIdleCallback = (
    global.requestIdleCallback ||
    function (fn, options) {
      timeout(function () {
        var t = time();
        timeout(function () {
          fn({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(
                0,
                next.minFPS - (time() - t)
              );
            }
          }, 1);
        });
      }, (options.timeout / 20) || 1);
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

function drop(queue, id) {
  var
    i = findIndex(queue, id),
    found = -1 < i
  ;
  if (found) queue.splice(i, 1);
  return found;
}

function exec(info) {
  info.fn.apply(null, info.ar);
}

function findIndex(queue, id) {
  var i = queue.length;
  while (i-- && queue[i].id !== id);
  return i;
}

function getLength(queue, queuex) {
  // if previous call didn't execute all callbacks
  return queuex.length ?
    // reprioritize the queue putting those in front
    queue.unshift.apply(queue, queuex) :
    queue.length;
}

// responsible for centralized requestIdleCallback operations
function idleLoop(deadline) {
  var length = getLength(qidle, qidlex);
  if (length) {
    // reschedule upfront next idle callback
    requestIdleCallback(idleLoop, {timeout: next.maxIdle});
    // this prevents the need for a try/catch within the while loop
    // reassign qidlex cleaning current idle queue
    qidlex = qidle.splice(0, length);
    while (qidlex.length && deadline.timeRemaining())
      exec(qidlex.shift());
  } else {
    // all idle callbacks have been executed
    // we can actually stop asking for idle operations
    idleRunning = false;
  }
}

function infoId(queue, info) {
  for (var i = 0, length = queue.length, tmp; i < length; i++) {
    tmp = queue[i];
    if (
      tmp.fn === info.fn &&
      tmp.ar.length === info.ar.length &&
      sameValues(tmp.ar, info.ar)
    ) return tmp.id;
  }
  return null;
}

function sameValues(a, b) {
  for (var i = 0, length = a.length; i < length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function time() {
  return now.call(performance);
}
