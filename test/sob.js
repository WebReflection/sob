//remove:
var main = require('../build/sob.node.js');
//:remove

wru.test([
  {
    name: "main",
    test: function () {
      wru.assert(typeof main == "object");
      // wru.assert(0);
    }
  }
]);
