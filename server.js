'use strict'
var HTTP = require('http');
var HTTPS = require('https');
var QS = require('querystring');
var URL = require('url');
var fs = require('fs');
var path = require('path');
var QS = require('querystring');
var sql = require('sqlite3');
var crypto = require('crypto');
sql.verbose();
var port = 5000;
var db = new sql.Database("Pete's FCRs.db");


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
    // var service = HTTP.createServer(serve);
    var options = {
        key: key,
        cert: cert
    };
    var service = HTTPS.createServer(options, serve);
    service.listen(process.env.PORT || port);
    console.log("Node app is running at localhost:" + process.env.PORT);
}

// Response codes: see http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
var OK = 200,
forceGetRedirect = 303,
tempRedirect = 307,
NotFound = 404,
BadType = 415,
Error = 500;

// Succeed, sending back the content and its type.
function succeed(response, type, content) {
    var typeHeader = {
        'Content-Type': type
    }
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

// Tell the browser to try again at a different URL.
function redirect(response, url, code) {
    var locationHeader = {
        'Location': url
    }
    response.writeHead(code, locationHeader);
    response.end();
}

// Give a failure response with a given code.
function fail(response, code) {
    response.writeHead(code);
    response.end();
}

function serve(request, response) {
    var url = URL.parse(request.url, true);
    var file = url.pathname;
    var file = "./Website" + file;
    var currentUser = 'guest';
    //Checks if path ends in /
    //if so displays index.html of folder
    if (ends(file, '/')) {
        file += 'index.html';
    } else if (ends(file, 'login')) {
        file += '.html';
    }
    var usersSessionID = request.headers.cookie;
    if (usersSessionID != undefined) {
        usersSessionID = usersSessionID.split('=')[1];
    }
    checkSessionID(usersSessionID, function(sessionDetails) {
        //Set and insert  current user into JSON.
        if (sessionDetails != undefined) {
            currentUser = sessionDetails.username;
            updateTimeout(currentUser);
        }
        var currentUserObj = {
            user: currentUser
        };
        var outputFilename = 'Website/Website.json';
        fs.writeFile(outputFilename, JSON.stringify(currentUserObj), function(err) {
            if (err) {
                console.log(err);
            }
        });
        if(request.method == "GET") {
            var queries = url.query;
            if(currentUser != 'guest'){
                //Checks if login page if so redirects to
                //homepage since already logged in.
                if(queries.logout == 'true'){
                    logoutUser(currentUser);
                    redirect(response, "/", forceGetRedirect);
                }
                else if (ends(file, 'login.html')) {
                    redirect(response, '/', forceGetRedirect);
                }
                //Grants access to private page since logged in.
                else if (file.toLowerCase() == './website/newsform.html') {
                    try {
                        fs.readFile('./Private/newsForm.html', function(error, content) {
                            if (error) return fail(response, NotFound);
                            succeed(response, types[".html"], content);
                        });
                    } catch (err) {
                        fail(response, Error);
                        return Error
                    }
                } else if(file == "./Website/index.html") {
                    getNewsData(5, function(newsData){
                        var outputFilename = 'Website/News.json';
                        fs.writeFile(outputFilename, JSON.stringify(newsData), function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        var displayError = displayContent(request, response, file);
                        if (displayError != OK) {
                            return displayError;
                        }
                    });
                } else {
                    var displayError = displayContent(request, response, file);
                    if (displayError != OK) {
                        return displayError;
                    }
                }
            } else{
                if(file == "./Website/index.html") {
                    getNewsData(5, function(newsData){
                        var outputFilename = 'Website/News.json';
                        fs.writeFile(outputFilename, JSON.stringify(newsData), function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        var displayError = displayContent(request, response, file);
                        if (displayError != OK) {
                            return displayError;
                        }
                    });
                } else{
                    var displayError = displayContent(request, response, file);
                    if (displayError != OK) {
                        return displayError;
                    }
                }
            }
        } else if(request.method == "POST") {
            var body = '';
            request.on('data', function(data) {
                body += data;
                // Too much POST data, kill the connection!
                if (body.length > 1e6) {
                    request.connection.destroy();
                }
            });
            request.on('end', function() {
            var queries = QS.parse(body);
                if(file == "./Website/loginUser"){
                    if(currentUser == "guest"){
                        checkLoginDetails(queries, response, checkLoginCallback);
                    }
                } else if(file == "./Website/submitContact"){
                        submitContactInfo(queries, request, response);
                } else if(file == "./Website/submitNews"){
                        submitNewsArticle(queries, request, response);
                }
            }); 
        }
    });
}

function checkLoginCallback(loginSuccessful, queries, response){
    if (loginSuccessful) {
        console.log("Logged In Succesfully");
        try {
            var sessionID = crypto.randomBytes(64).toString('hex');
        } catch (ex) {
            console.log('Error: ' + ex)
        }
        var name = 'SessionID=';
        previousLogoutUnsuccessful(queries.username, function(update) {
            if (update) {
                updateSessionID(queries.username, sessionID);
            } else {
                insertSessionID(queries.username, sessionID);
            }
            // var expires = 'expires='+ (new Date().toGMTString());
            response.setHeader('Set-Cookie', name + sessionID);
            redirect(response, '/', forceGetRedirect);
        });
    } else {
        console.log("Log In Failed");
        redirect(response, '/login.html?loginFailed=true', forceGetRedirect);
    }
}

function displayContent(request, response, file) {
    var type = findType(request, path.extname(file));
    if (!type) {
        fail(response, BadType);
        return BadType;
    }
    if (urlPathChecks(request, response, file) < 0) {
        return NotFound;
    }
    try {
        fs.readFile(file, function(error, content) {
            if (error) return fail(response, NotFound);
            succeed(response, type, content);
        });
    } catch (err) {
        fail(response, Error);
        return Error
    }
    return OK;
}

function urlPathChecks(request, response, file) {
    if (!inSite(file)) {
        fail(response, NotFound);
        return -1;
    }
    if (!matchCase(file)) {
        fail(response, NotFound);
        return -1;
    }
    if (!noSpaces(file)) {
        fail(response, NotFound);
        return -1;
    }
    if (!noParentDir(file)) {
        fail(response, NotFound);
        return -1;
    }
    return 0;
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
    return s.indexOf(x, s.length - x.length) - (s.length - x.length) == 0;
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
function noParentDir(file) {
    return file.indexOf('..') < 0;
}

// Check if object is empty.
function isEmpty(obj) {
    return (Object.getOwnPropertyNames(obj).length === 0);
}

//DATABASE FUNCTIONS
function checkLoginDetails(queries, response, callback) {
    var username = queries.username;
    var password = queries.password;
    var ps = db.prepare("select * from users where username = ?", errorFunc);
    ps.all(username, function(err, rows) {
        if (err) throw err;
        if(rows.length == 1){
            var saltedPassword = toHex(password) + rows[0].salt;
            var sha256 = crypto.createHash('sha256');
            sha256.update(saltedPassword);
            if(sha256.digest('hex') == rows[0].password){
                callback(true, queries, response);
            }
            else{
                callback(false, queries, response);
            }
        }
        else{
            callback(false, queries, response);
        }
    });
    ps.finalize();
}

function submitContactInfo(queries, request, response) {
    var name = queries.Name;
    var email = queries.Email;
    var message = queries.Message;
    var ps = db.prepare("insert into messages values (?, ?, ?, ?)", errorFunc);
    ps.all(name, email, message, new Date(), function(err, rows) {
        redirect(response, "/contact.html?submitContact=true", forceGetRedirect);
    });
    ps.finalize();
}

function submitNewsArticle(queries, request, response) {
    var title = queries.Title;
    var content = queries.Content;
    var ps = db.prepare("insert into news values (?, ?, '" + new Date() + "')", errorFunc);
    ps.all(title, content, function(err, rows) {
        redirect(response, '/', forceGetRedirect);
    });
    ps.finalize();
}

function insertSessionID(username, sessionID) {
    var expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 30);
    var ps = db.prepare("insert INTO sessionIDs values (?, ?, ?)", errorFunc);
    ps.run(username, sessionID, expiryTime);
    ps.finalize();
}

function updateTimeout(username) {
    var expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 30);
    var ps = db.prepare("update sessionIDs set timeout = ? where username = ?", errorFunc);
    ps.run(expiryTime, username);
    ps.finalize();
}

function updateSessionID(username, sessionID) {
    var expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 30);
    var ps = db.prepare("update sessionIDs set sessionID = ?, timeout = ? where username = ?", errorFunc);
    ps.run(sessionID, expiryTime, username);
    ps.finalize();
}

function previousLogoutUnsuccessful(username, callback) {
    var ps = db.prepare("select * from sessionIDs where username = ?", errorFunc);
    ps.all(username, function(err, rows) {
        if (err) throw err;
        callback(rows.length == 1)
    });
    ps.finalize();
}

function checkSessionID(sessionID, callback) {
    var ps = db.prepare("select * from sessionIDs where sessionID = ?", errorFunc);
    ps.all(sessionID, function(err, rows) {
        if (err) throw err;
        if (rows.length == 1) {
            if (rows[0].timeout > (new Date())) {
                callback(rows[0]);
            } else {
                callback(undefined);
            }
        } else {
            callback(undefined);
        }
    });
    ps.finalize();
}

function logoutUser(currentUser){
    var ps = db.prepare("delete from sessionIDs where username = ?", errorFunc);
    ps.run(currentUser);
    ps.finalize();
}

function getNewsData(numOfArticles, callback){
    var ps = db.prepare("select * from news order by date DESC LIMIT ?", errorFunc);
    ps.all(numOfArticles, function(err, rows){
        if (err) throw err;
        callback(rows);
    });
    ps.finalize();
}

function errorFunc(e, row) {
    if (e) throw e;
}

function toHex(str) {
    var result = '';
    for (var i=0; i<str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
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
