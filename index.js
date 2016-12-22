var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var swarm = require('hyperdiscovery')
 
var drive = hyperdrive(memdb())
var archive = drive.createArchive('f74e1a4aa822dfd442f48885f7614724e585d493e498df8f90ff98250aa1906b')
 
var sw = swarm(archive)
sw.on('connection', function (peer, type) {
  var stream = archive.createFileReadStream('Dylan2.jpg')
  stream.on('data', function (data) {
    console.log(data) // <-- file data
  })
  stream.on('end', function () {
    console.log('no more data')
  })
})
