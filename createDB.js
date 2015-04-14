"use strict";
var sql = require("sqlite3");
sql.verbose();
var db = new sql.Database("Pete's FCRs.db");
db.serialize(startup);
function startup() {
  db.run("create table sessionIDs (username, sessionID, timeout)", err);
  db.run("create table users (username, password, email)", err);
  db.run("insert into users values ('admin', 'password', 'rm12913@my.bristol.ac.uk')", err);
  db.close();
}
function err(e) { if (e) throw e; }