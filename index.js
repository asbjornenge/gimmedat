var express = require('express')
var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var swarm = require('hyperdiscovery')
var PORT = 3000

var app = express()
app.get('/:link', 
  function(req, res, next) {
    if(req.url.substr(-1) != '/' && req.url.length > 1)
      res.redirect(301, req.url+'/')
    else
      next()
  },
  function(req, res) {
    var db = memdb()
    var drive = hyperdrive(db)
    var archive = drive.createArchive(req.params.link)
    var sw = swarm(archive)
    var downloading = false
    sw.once('connection', function (peer, type) {
      archive.list(function(err, entries) {
        if (err) return res.status(500).send(err.message)
        var fileNames = entries.reduce(function(coll, curr) {
          if (curr.name == "") return coll
          return coll+"<a href='"+curr.name+"'>"+curr.name+"</a><br/>"
        },'')
        res.end(fileNames)
      })
    })
})
app.get('/:link/:content', function(req, res) {
  var db = memdb()
  var drive = hyperdrive(db)
  var archive = drive.createArchive(req.params.link)
  var sw = swarm(archive)
  sw.once('connection', function (peer, type) {
    var stream = archive.createFileReadStream(req.params.content)
    stream.pipe(res)
    stream.on('error', function(err) {
      if (err.message == 'Could not find entry')
        res.status(404).send(err.message)
      else
        res.status(500).send(err.message)
    })
  })
})

app.listen(PORT, function () {
  console.log('Listening on :'+PORT)
})
