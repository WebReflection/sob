Scheduled on Browser [![build status](https://secure.travis-ci.org/WebReflection/sob.svg)](http://travis-ci.org/WebReflection/sob)
====================

This is a zero dependencies utility to manage, in a simple and fully cross browser way, calls to [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) and [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback).

Things this module does:

  * it [doesn't overload](https://medium.com/@paul_irish/requestanimationframe-scheduling-for-nerds-9c57f7438ef4#.dui1p8y4f) the `requestAnimationFrame` internal queue
  * it schedules `frame` or `idle` passing extra arguments if specified, same as `setTimeout` and `setInterval`
  * it avoids duplicated scheduling of the same callback with same optional arguments
  * it makes `cancelAnimationFrame` and `cancelIdleCallback` consistent across browsers via `clear` method and for both scheduled queue and currently executed one
  * it provides a similar `requestIdleCallback` mechanism for every browser

### API
Following all methods provided by the object returned via this module.
```js
const sob = require('sob');
```

#### `sob.frame(fn) => uniqueId`
Schedules `fn` for the next possible `requestAnimationFrame` without compromising performance.
It returns a unique id usable to `sob.clear(uid)` if necessary.

#### `sob.frame(fn, arg1, arg2, argN) => uniqueId`
Similar to `sob.frame(fn)`, it schedules `fn` for the next possible `requestAnimationFrame` invoking it with optionally provided arguments.

#### `sob.idle(fn) => uniqueId`
Schedules `fn` for the next possible `requestIdleCallback` without compromising performance.
It returns a unique id usable to `sob.clear(uid)` if necessary.

#### `sob.idle(fn, arg1, arg2, argN) => uniqueId`
Similar to `sob.idle(fn)`, it schedules `fn` for the next possible `requestIdleCallback` invoking it with optionally provided arguments.

#### `sob.clear(uniqueId)`
Remove a previously scheduled `frame` or `idle` through the previously returned unique id.

### Examples
Following a basic example on how to use this module.
The TL;DR verion is that whenever you'd like to use `requestAnimationFrame` or `requestIdleCallback`, you can use `sob` instead.

```js
// simulating a requestAnimationFrame task
(function frameLoop() {
  sob.frame(frameLoop);
  document.body.textContent = new Date();
}());

// simulating a requestIdleCallback task
(function idleLoop() {
  sob.idle(idleLoop);
  console.log('idle');
}());
```