'use strict'
var HTTP = require('http');
var HTTPS = require('https');
var QS = require('querystring');
var URL = require('url');
var fs = require('fs');
var path = require('path');
var QS = require('querystring');
var sql = require('sqlite3');
sql.verbose();
var port = 5000;

var types = {
    '.html': 'text/html, application/xhtml+xml',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.mp3': 'audio/mpeg', // audio
    '.aac': 'audio/aac', // audio
    '.mp4': 'video/mp4', // video
    '.webm': 'video/webm', // video
    '.gif': 'image/gif', // only if imported unchanged
    '.jpeg': 'image/jpeg', // only if imported unchanged
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain', // plain text only
    '.xhtml': '#not suitable for dual delivery, use .html',
    '.htm': '#proprietary, non-standard, use .html',
    '.jpg': '#common but non-standard, use .jpeg',
    '.rar': '#proprietary, non-standard, platform dependent, use .zip',
    '.doc': '#proprietary, non-standard, platform dependent, ' +
        'closed source, unstable over versions and installations, ' +
        'contains unsharable personal and printer preferences, use .pdf',
};

function start() {
    var service = HTTP.createServer(serve);
    // var options = {
    //     key: key,
    //     cert: cert
    // };
    //var service = HTTPS.createServer(options, serve);
    service.listen(process.env.PORT || port);
    console.log("Node app is running at localhost:" + process.env.PORT);
} 

// Response codes: see http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
var OK = 200,
    Redirect = 307,
    NotFound = 404,
    BadType = 415,
    Error = 500;

// Succeed, sending back the content and its type.
function succeed(response, type, content) {
    var typeHeader = {
        'Content-Type': type
    };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

// Tell the browser to try again at a different URL.
function redirect(response, url) {
    var locationHeader = {
        'Location': url
    };
    response.writeHead(Redirect, locationHeader);
    response.end();
}

// Give a failure response with a given code.
function fail(response, code) {
    response.writeHead(code);
    response.end();
}

function serve(request, response) {
    var admin = false;
    var url = URL.parse(request.url, true);
    var file = url.pathname;
    var queries = url.query;
	var file = "./Website" + file;
    if(request.method == "POST"){
        var body = '';
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            if (body.length > 1e6){
                request.connection.destroy();
            }
        });
        request.on('end', function () {
            var queries = QS.parse(body);
            checkLoginDetails(queries.username, queries.password, function(loginSuccessful){
                if(loginSuccessful){
                    console.log("Logged In Succesfully");
                }
                else{
                    console.log("Log In Failed");
                }
            });
            // use post['blah'], etc.
        });
    }
    var params = QS.parse(body);
    if(queries != undefined && !isEmpty(queries)){
        checkLoginDetails(queries.username, queries.password);
    }
    //Checks if path ends in /
    //if so displays index.html of folder
	if (ends(file, '/')){
		file += 'index.html';
	}
    else if (ends(file, 'login')){
        file += '.html';
    }
    var type = findType(request, path.extname(file));
    if(!type){
        return fail(response, BadType);
    }    
    if (!inSite(file)) {
        return fail(response, NotFound);
    }
    if (!matchCase(file)) {
        return fail(response, NotFound);
    }
    if (!noSpaces(file)) {
        return fail(response, NotFound);
    }
    if (!noParentDir(file) && !admin){
        return fail(response, NotFound);
    }
	try {
        fs.readFile(file, ready);
    } catch (err) {
        return fail(response, Error);
    }
    function ready(error, content) {
        if (error) return fail(response, NotFound);
        succeed(response, type, content);
    }
}

// Find the content type (MIME type) to respond with.
// Content negotiation is used for XHTML delivery to new/old browsers.
function findType(request, extension) {
    var type = types[extension];
    if (!type) return type;
    if (extension != ".html") return type;
    var htmlTypes = types[".html"].split(", ");
    var accepts = request.headers['accept'].split(",");
    if (accepts.indexOf(htmlTypes[1]) >= 0) return htmlTypes[1];
    return htmlTypes[0];
}

// Check whether a string starts with a prefix, or ends with a suffix
function starts(s, x) {
	return s.lastIndexOf(x, 0) == 0;
}
function ends(s, x) {
	return s.indexOf(x, s.length-x.length) - (s.length-x.length) == 0;
}

// Check that a file is inside the site.  This is essential for security.
var site = fs.realpathSync('.') + path.sep;
function inSite(file) {
    var real;
    try {
        real = fs.realpathSync(file);
    } catch (err) {
        return false;
    }
    return starts(real, site);
}

// Check that the case of a path matches the actual case of the files.  This is
// needed in case the target publishing site is case-sensitive, and you are
// running this server on a case-insensitive file system such as Windows or
// (usually) OS X on a Mac.  The results are not (yet) cached for efficiency.
function matchCase(file) {
    var parts = file.split('/');
    var dir = '.';
    for (var i = 1; i < parts.length; i++) {
        var names = fs.readdirSync(dir);
        if (names.indexOf(parts[i]) < 0) return false;
        dir = dir + '/' + parts[i];
    }
    return true;
}

// Check that a name contains no spaces.  This is because spaces are not
// allowed in URLs without being escaped, and escaping is too confusing.
// URLS with other special characters are also not allowed.
function noSpaces(name) {
    return (name.indexOf(' ') < 0);
}

// Check that the path does not try to gain access to the parent directory.
function noParentDir(file){
    return file.indexOf('..') < 0;
}

// Check if object is empty.
function isEmpty(obj){
    return (Object.getOwnPropertyNames(obj).length === 0);
}

//DATABASE FUNCTIONS
function checkLoginDetails(username, password, callback){
    var loginSuccessful = false;
    var db = new sql.Database("Pete's FCRs.db");
    var ps = db.prepare("select * from users where Username = ? AND password = ?", errorFunc);
    ps.all(username, password, function (err, rows){
        if (err) throw err;
        loginSuccessful = (rows.length == 1);
        callback(loginSuccessful);
    });
    ps.finalize();
    db.close(); 
}

function testfunc(loginSuccessful1, list){
    console.log(loginSuccessful1 = list.length == 1);
    return loginSuccessful1;
}

function errorFunc(e, row) {
    if (e) throw e;
}

//KEYS FOR HTTPS
var key =
    "-----BEGIN RSA PRIVATE KEY-----\n" +
    "MIIEpQIBAAKCAQEAycE3rVt8kvynUuW5VGDDLjHYzXODwfRASYH/QQT02DsgyIXZ\n" +
    "WzDcDyJeyBJRCuVw6ggAWk3d9r+te0UIgWmh3aiHbE7XjGIP5KSVzsCJWFaapi35\n" +
    "Iqh3r2tDUO7h7kwrMJ/o16fQamGb4uwuAgChwLHc8Y2pKwSRmoXB7YBcFV/fAA9x\n" +
    "rDDvuaW6kukUZTkP/FJ6xfvxYBeT8NxBVTT3r3jA89rpAbGDzFZkPcZeyIpnvOZ3\n" +
    "dN52ak5gM2cfmD/HmNZbXrvBdFSuNJyBaJrI49o55fjhEuscvagdyZIE6jUzu+gw\n" +
    "A+sW1D/OpiO3V5awVE8boIDE4Z8NGgMfTcSuLwIDAQABAoIBAQCm8K31UAIgTdbW\n" +
    "DSfw3bAjBTPzrGWVk1mueVaQol1GnoZd5gMYJbGxBCuROTa94WQxAjXogw3rImeV\n" +
    "3GVRT+qT0uNbh1Fr46hq9JTQ4xfCdMa6QsgnGWcPS54D1eY0m+oQ7gBokX8ux12J\n" +
    "wwu+tG8jVwkPBry3z6v7RDpXHyMSuyx9YY/lHDPUTYoSrLY/2pzgt8BX+rZlRc3W\n" +
    "RDawgYJpyYC04/q4CZNbrCBfc2Sa3ahMFGPOonVVwqPNPqTku9Ux4jTXbcNCZKbC\n" +
    "/l9kSw2uPyMArE/T1jIce4f/cshUkM+W9rem2sNthb4ltUqtaf12yI2hW95gPAYC\n" +
    "IloV6LmBAoGBAPNFTGng4YiEZ+DEBaSc6HHug16yJygZ8m2kDe6LnCRpholyOtqJ\n" +
    "uRVzrZvcZprweGaXH7OdLIzjk0yLaZgOZp1qIf7lwRxHjnHNnxectokgYfRzZnY7\n" +
    "pP17z+w0BIdMXkX9/HAmdE4zBdpFcix11uNyMo/fiv602OAEbIYcomO/AoGBANRP\n" +
    "zCn10Ny3SLKMhQQgYdq1xb0TwpcocNtQen8HCsWWEXAbY14eN49/2C3vt42LR8my\n" +
    "vIy6HPYe0QMAcl5p6c+I6Z4yiEaRtKZzxLvBiDPvv0Qu6qMwEnxzw5b98emrZHBb\n" +
    "t5m7gCOWx0c9bBtmvZ17kOcGuf21wrqQ82O7dZGRAoGBAJUcAsxbBKJS1gEU5YiS\n" +
    "jH9Y/LjMZefUj53YkpmGhTxkWgxhMeXFyOZ3MxB3tYR+pK3tL4c+bZIl46FlSmHj\n" +
    "Yc5WwWOlnAojahIjQMKOUewXJzNYkJMj1+tvOnDDKYtsqdQo69QqHdvYtluleWf7\n" +
    "Cq36zzcUg/O/Ebetvn8tifOtAoGALXh5rXLsLJlEhJj71AprasALfZdB0cXjhdUS\n" +
    "pyoG8JJXYb875Ohr1dv3nL7+fN4bneMd5rXlhgDLmuz5kab1YHFeN3dzIEoMeqnI\n" +
    "tL2aQiVSvXOe5RximSzh8vCoYvdGJ5o9FDvIEdc1Dtjk0mmKqrPQMOqL4v6Omg55\n" +
    "Uh7P60ECgYEAg7qkTP1dOVhxPhIpG0GaBBGy2Ra51hK3t9MhgcxLOIFooLiXuj3f\n" +
    "/fSHK3GxsLyENhvG7SaxIwFrWUl15p/rHF3aPU55l/5zBrRXIcVAj9RuLTlj1aLy\n" +
    "3NS5lZasetHCyT359f1aNVlO41qqpB0Dtjzh2EgnOoZxhREpQHRftks=\n" +
    "-----END RSA PRIVATE KEY-----"

var cert = 
    "-----BEGIN CERTIFICATE-----\n" +
    "MIIDKjCCAhICCQC2zUROIeJxJDANBgkqhkiG9w0BAQsFADBXMQswCQYDVQQGEwJV\n" +
    "SzETMBEGA1UECAwKU29tZS1TdGF0ZTEQMA4GA1UEBwwHQnJpc3RvbDEhMB8GA1UE\n" +
    "CgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMB4XDTE1MDQwODIwMTg1MFoXDTE2\n" +
    "MDQwNzIwMTg1MFowVzELMAkGA1UEBhMCVUsxEzARBgNVBAgMClNvbWUtU3RhdGUx\n" +
    "EDAOBgNVBAcMB0JyaXN0b2wxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5\n" +
    "IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMnBN61bfJL8p1Ll\n" +
    "uVRgwy4x2M1zg8H0QEmB/0EE9Ng7IMiF2Vsw3A8iXsgSUQrlcOoIAFpN3fa/rXtF\n" +
    "CIFpod2oh2xO14xiD+Sklc7AiVhWmqYt+SKod69rQ1Du4e5MKzCf6Nen0Gphm+Ls\n" +
    "LgIAocCx3PGNqSsEkZqFwe2AXBVf3wAPcaww77mlupLpFGU5D/xSesX78WAXk/Dc\n" +
    "QVU09694wPPa6QGxg8xWZD3GXsiKZ7zmd3TedmpOYDNnH5g/x5jWW167wXRUrjSc\n" +
    "gWiayOPaOeX44RLrHL2oHcmSBOo1M7voMAPrFtQ/zqYjt1eWsFRPG6CAxOGfDRoD\n" +
    "H03Eri8CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAgtI0Hyu7Uy8U6MKCWBpmhThH\n" +
    "B677MD7DUDxm8Ofv9AlOMMjSWG0EKJrDHOuW0en3AzXVeRfgu2RMsvFNgUfMliwL\n" +
    "vgbAX2nZhk6LT3d2K+DHH9C32zDLegyUsne/S/0byAyRnuiS8LHdntZCRXxep6Qs\n" +
    "TLcryIDgNLM0R255AQHHDJj5oMdaTsEhWfa+IiPYwMcBl1yVtH66/ONXfljMjpqw\n" +
    "JmVF7+hj5Il/arUCDS8kuX8r9UH9Ili5bLnzxQKat4EsXY/S2eb0bCQLw0wvDPlq\n" +
    "mcaGRppscKkaYzY/yE7TL7HJJAB+HPDAkW49Qqo2vPBOtUKhqLmdMKKvij96jA==\n" +
    "-----END CERTIFICATE-----"

start();