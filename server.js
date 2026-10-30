var http = require("http");
var fs = require("fs");
var path = require("path");

var PORT = process.env.PORT || 4310;
var ROOT = __dirname;

var mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function safePath(requestUrl) {
  var cleanUrl = requestUrl.split("?")[0].split("#")[0];
  var filePath = cleanUrl === "/" ? "/index.html" : cleanUrl;
  return path.join(ROOT, path.normalize(filePath));
}

var server = http.createServer(function(req, res) {
  var filePath = safePath(req.url);

  if (!filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, function(err, content) {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 Not Found</h1>");
      return;
    }

    var ext = path.extname(filePath);
    var contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(PORT, function() {
  console.log("Server running at http://localhost:" + PORT);
});
