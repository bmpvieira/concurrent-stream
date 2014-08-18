var through = require('through2')
var merge = require('merge-stream')
var duplexify = require('duplexify')
var roundround = require('roundround')

module.exports = concurrent = function(concurrency, userStream) {
  if (concurrency < 2) { return userStream() }

  if (userStream()._readableState.objectMode) {
    _through = through.obj
    _duplexify = duplexify.obj
  }
  else {
    _through = through
    _duplexify = duplexify
  }

  var streams = []

  streams.push(userStream())
  streams.push(userStream())

  var merged = merge(streams[0], streams[1])

  for (var i = 2; i < concurrency; i++) {
    streams.push(userStream())
    merged.add(streams[i])
  }

  var rr = roundround(streams)

  var entryStream = _through(splitter)
  var stream = _duplexify(entryStream, merged)

  return stream

  function splitter(obj, enc, next) {
    rr().write(obj, next)
  }
}
