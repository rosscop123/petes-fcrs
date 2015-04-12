"use strict";
var sql = require("sqlite3");
sql.verbose();
var db = new sql.Database("Pete's FCRs.db");
db.serialize(startup);
function startup() {
  db.run("create table users (Username, email, password)", err);
  db.run("insert into users values ('admin','rm12913@my.bristol.ac.uk', 'dave10101')", err);
  db.run("insert into users values ('josh','jt12917@my.bristol.ac.uk', 'password1')", err);
  db.close();
}
function err(e) { if (e) throw e; }