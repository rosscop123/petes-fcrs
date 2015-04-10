"use strict";
var sql = require("sqlite3");
sql.verbose();
var db = new sql.Database("test.db");

var ps = db.prepare("update pets set kind=? where kind=?");
ps.run("dog", "canine");
db.run("insert into pets values ('bob','cat')", err);
db.each("select * from pets", show);
ps.finalize();

db.close();

function err(e) { if (e) throw e; }

function show(err, row) {
    if (err) throw err;
    console.log(row);
}