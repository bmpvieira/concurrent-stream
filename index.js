var through = require('through2')
var merge = require('merge-stream')
var pumpify = require('pumpify')

module.exports = concurrent = function(concurrency, userStream) {
  if (concurrency < 2) { return userStream() }

  if (userStream()._readableState.objectMode) {
    _through = through.obj
    _pumpify = pumpify.obj
  }
  else {
    _through = through
    _pumpify = pumpify
  }

  var streams = {}
  var lastUsedStream = -1

  streams[0] = userStream()
  streams[1] = userStream()

  var merged = merge(streams[0], streams[1])

  for (var i = 2; i < concurrency; i++) {
    streams[i] = userStream()
    merged.add(streams[i])
  }

  var entryStream = _through(splitter)
  var stream = _pumpify(entryStream, merged)

  return stream

  function splitter(obj, enc, next) {
    lastUsedStream += 1
    if (lastUsedStream === concurrency) {
      lastUsedStream = 0
    }
    if (streams[lastUsedStream].write(obj))
    next()
  }
}
