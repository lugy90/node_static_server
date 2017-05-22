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
                    let raw = fs.createReadStream(realPath);
                    // let acceptEncoding = request.headers['accept-encoding'] || '';
                    // if (extName.match(Compress.match) && acceptEncoding.match(/\bdeflate\b/)) {
                    //   response.writeHead(200, { 'Content-Encoding': 'deflate' });
                    //   raw.pipe(zlib.createDeflate()).pipe(response);
                    // } else if (extName.match(Compress.match) && acceptEncoding.match(/\bgzip\b/)) {
                    //   response.writeHead(200, { 'Content-Encoding': 'gzip' });
                    //   raw.pipe(zlib.createGzip()).pipe(response);
                    // } else {
                    //   response.writeHead(200, {});
                    //   raw.pipe(response);
                    // }
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

app.listen(80, "127.0.0.1");