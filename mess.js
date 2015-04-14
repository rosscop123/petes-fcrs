"use strict";
var sql = require("sqlite3");
sql.verbose();
var db = new sql.Database("Pete's FCRs.db");
db.each("select * from messages", function(err, rows){
	console.log(rows);
});
db.close();

function errorFunc(e, row) {
    if (e) throw e;
}