var sql = require("sqlite3");
sql.verbose();
var db = new sql.Database("Pete's FCRs.db");
var ps = db.prepare("select * from users");
ps.run(function(err, rows){
	console.log(rows);
})