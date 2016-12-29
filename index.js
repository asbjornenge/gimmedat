var fs = require('fs')
var http = require('http')
var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var swarm = require('hyperdiscovery')
var marked = require('marked')
var readme = marked(fs.readFileSync('./README.md').toString())
var PORT = 3000
var connections = {}

function getconnection(link, callback) {
  if (connections[link]) return callback(connections[link])
  var db = memdb()
  var drive = hyperdrive(db)
  var archive = drive.createArchive(link)
  var sw = swarm(archive)
  sw.once('connection', function (peer, type) {
    connections[link] = {
      sw: sw,
      archive: archive
    }
    callback(connections[link])
  })
}

function listdir(archive, res) {
  archive.list(function(err, entries) {
    if (err) {
      res.statusCode = 500
      return res.end(err.message)
    }
    var fileNames = entries.reduce(function(coll, curr) {
      if (curr.name == "") return coll
      return coll+"<a href='"+curr.name+"'>"+curr.name+"</a><br/>"
    },'')
    res.end(fileNames)
  })
}

function getfile(archive, path, res) {
  var stream = archive.createFileReadStream(path.join('/'))
  stream.pipe(res)
  stream.on('error', function(err) {
    if (err.message == 'Could not find entry') {
      res.statusCode = 404
      res.end(err.message)
    }
    else {
      res.statusCode = 500
      res.end(err.message)
    }
  })
}

http.createServer(function(req,res) {
  var path = req.url.split('/').filter(function(p) {
    return p != ""
  })
  if (path.length == 0) {
    return res.end(readme)
  }
  var link = path.shift()
  try {
    getconnection(link, function(conn) {
      if (path.length == 0) {
        // List dir
        if(req.url.substr(-1) != '/' && req.url.length > 1) {
          res.statusCode = 301
          res.setHeader('Location', req.url+'/')
          return res.end()
        }
        listdir(conn.archive, res)
      }
      else {
        // Get file
        getfile(conn.archive, path, res)
      }
    })
  } catch(e) {
    res.statusCode = 500
    return res.end(e.message)
  }
}).listen(PORT, function() {
  console.log('Listening on :'+PORT)
})
