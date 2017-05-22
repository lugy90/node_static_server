let http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    MIME = require("./MIME.js").type,
    utils = require("./utils"),
    zlib = require("zlib");

let staticPath = "./assets/";

let Expires = {
    fileMatch: /^(gif|png|jpg|js|css)$/ig,
    maxAge: 60 * 60 * 24 * 365 // 一年
};

let Compress = {
    match: /css|js|html/ig
};

const PORT = 8000;

let app = http.createServer((request, response) => {
    let pathName = url.parse(request.url).pathname || "",
        realPath = path.join(staticPath, path.normalize(pathName.replace(/\.\./g, ""))); // 请求文件的在磁盘中的真实地址

    fs.exists(realPath, (exists) => {
        if(!exists) {
            // 当文件不存在时
            response.writeHead(404, {"Content-Type": "text/plain"});

            response.write("This request URL ' " + realPath + " ' was not found on this server.");
            response.end();
        } else {
            // 当文件存在时
            fs.readFile(realPath, "binary", (err, file) => {
                if (err) {
                    // 文件读取出错
                    response.writeHead(500, {"Content-Type": "text/plain"});

                    response.end(err);
                } else {
                    // 当文件可被读取时，输出文本流
                    let extName = path.extname(realPath);
                    extName = extName ? extName.slice(1) : "";
                    let contentType = MIME[extName] || "text/plain";

                    if (extName.match(Expires.fileMatch)) {
                        let expires = new Date();
                        expires.setTime(expires.getTime() + Expires.maxAge * 1000);
                        response.setHeader("Expires", expires.toUTCString());
                        response.setHeader("Cache-Control", "max-age=" + Expires.maxAge);
                    }

                    let stat = fs.statSync(realPath);
                    let lastModified = stat.mtime.toUTCString();
                    response.setHeader("Last-Modified", lastModified);

                    if (request.headers["if-modified-since"] && lastModified == request.headers["if-modified-since"]) {
                        response.writeHead(304, "Not Modified");
                        response.end();
                        return;
                    }
                    if (request.headers["range"]) {
                        let range = utils.parseRange(request.headers["range"], stats.size);
                        if (range) {
                            response.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stats.size);
                            response.setHeader("Content-Length", (range.end - range.start + 1));
                            let raw = fs.createReadStream(realPath, {
                                "start": range.start,
                                "end": range.end
                            });
                            compressHandle(extName, raw, 206, "Partial Content");
                        } else {
                            response.removeHeader("Content-Length");
                            response.writeHead(416, "Request Range Not Satisfiable");
                            response.end();
                        }
                    } else {
                        let raw = fs.createReadStream(realPath);
                        compressHandle(extName, raw, 200, "Ok");
                    }
                }
            });
        }
    });
});

function compressHandle(ext, raw, statusCode, reasonPhrase) {
    var stream = raw;
    var acceptEncoding = request.headers['accept-encoding'] || "";
    var matched = ext.match(config.Compress.match);
    if (matched && acceptEncoding.match(/\bgzip\b/)) {
        response.setHeader("Content-Encoding", "gzip");
        stream = raw.pipe(zlib.createGzip());
    } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
        response.setHeader("Content-Encoding", "deflate");
        stream = raw.pipe(zlib.createDeflate());
    }
    response.writeHead(statusCode, reasonPhrase);
    stream.pipe(response);
};

app.listen(PORT);
console.log("Server runing at port: " + PORT + ".");