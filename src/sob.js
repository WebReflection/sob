//! (C) Andrea Giammarchi @WebReflection - MIT Style License

// TODO:
//  make it possible to define a timeout for the IDLE
//  define a default timeout anyway or non compatible browsers
//  might actually never trigger a thing
var
  // local shams
  performance = global.performance || {now: Date.now},
  now = (
    performance.now ||
    performance.webkitNow ||
    function now() { return (new Date()).getTime(); }
  ),
  requestAnimationFrame = global.requestAnimationFrame ||
                          global.webkitRequestAnimationFrame ||
                          global.mozRequestAnimationFrame ||
                          function (fn) { setTimeout(fn, 16); },
  requestIdleCallback = global.requestIdleCallback,
  // CONSTANTS
  NO_IDLE = !requestIdleCallback,
  // local helpers
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
  geLength = function geLength(queue, queuex) {
    // if previous call didn't execute all callbacks
    return queuex.length ?
      // reprioritize the queue putting those in front
      queue.unshift.apply(queue, queuex) :
      queue.length;
  },
  infoId = function infoId(queue, info) {
    for (var i = 0, tmp; i < queue.length; i++) {
      tmp = queue[i];
      if (
        tmp.fn === info.fn &&
        tmp.ar.length === info.ar.length &&
        sameValues(tmp.ar, info.ar)
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
  runUntilOvertime = function (queue, t) {
    // calculate how many millisends we have
    var fps = 1000 / next.minFPS;
    // execute the whole queue
    while (queue.length) {
      // if some of them fails, it's OK
      // next round will re-prioritize the animation frame queue
      exec(queue.shift());
      // if we exceeded the frame time, get out this loop
      if ((now.call(performance) - t) >= fps) return true;
    }
    return false;
  },
  sameValues = function sameValues(a, b) {
    for (var i = 0, length = a.length; i < length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  },
  // exported module
  next = {
    // if true, shows "frame overload" when it happens
    debug: false,
    // when operations slow down FPS is true
    isOverloaded: false,
    // minimum accepted FPS (suggested range 20 to 60)
    minFPS: 60,
    // maximum delay per each requestIdleCallback operation
    maxIdle: 1000,
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
    t = now.call(performance),
    // used to flag overtime in case we exceed milliseconds
    overTime = false,
    // take current frame queue length
    length = geLength(qframe, qframex)
  ;
  // if there is actually something to do
  if (length || (NO_IDLE && qidle.length)) {
    // reschedule upfront next animation frame
    // this prevents the need for a try/catch within the while loop
    requestAnimationFrame(animationLoop);
    // reassign qframex cleaning current animation frame queue
    qframex = qframe.splice(0, length);
    // flag eventual overload info
    if ((next.isOverloaded = runUntilOvertime(qframex, t))) {
      // and if debug is true, warn about it
      if (next.debug) console.warn('overloaded frame');
    }
    // if the browser has no idle callback and there's no overload
    else if (NO_IDLE) {
      // execute callbacks from the idle queue
      runUntilOvertime((qidlex = qidle.splice(
        0, geLength(qidle, qidlex)
      )), t);
    }
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
    // take current idle queue length
    // if previous call didn't execute all callbacks
    length = geLength(qidle, qidlex)
  ;
  // if there is actually something to do
  if (length) {
    // reschedule upfront next idle callback
    requestIdleCallback(idleLoop, {timeout: next.maxIdle});
    // this prevents the need for a try/catch within the while loop
    // reassign qidlex cleaning current idle queue
    qidlex = qidle.splice(0, length);
    runUntilOvertime(qidlex, t);
  } else {
    // all idle callbacks have been executed
    // we can actually stop asking for idle operations
    idleRunning = false;
  }
}
