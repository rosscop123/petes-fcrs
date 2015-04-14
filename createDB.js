"use strict";
var sql = require("sqlite3");
var crypto = require("crypto");
sql.verbose();
var db = new sql.Database("Pete's FCRs.db");
db.serialize(startup);
function startup() {
  db.run("create table sessionIDs (username NOT NULL, sessionID, timeout, constraint pk_sessionIDs PRIMARY KEY (username))", err);
  db.run("create table messages (Name NOT NULL, sendersEmail, message, time NOT NULL, constraint pk_messages PRIMARY KEY (Name, time))", err);
  db.run("create table users (username NOT NULL, password, salt, email, constraint pk_users PRIMARY KEY (username))", err);
  var salt = crypto.randomBytes(32).toString('hex');
  var password = toHex('password') + salt;
  var sha256 = crypto.createHash('sha256');
  sha256.update(password);
  db.run("insert into users values ('admin', '" + sha256.digest('hex') + "', '" +
  	salt + "', 'rm12913@my.bristol.ac.uk')", err);
  db.close();
}
function err(e) { if (e) throw e; }

function toHex(str) {
	var result = '';
	for (var i=0; i<str.length; i++) {
	  result += str.charCodeAt(i).toString(16);
	}
	return result;
}