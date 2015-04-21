"use strict";
var sql = require("sqlite3");
var crypto = require("crypto");
sql.verbose();
var db = new sql.Database("Pete's FCRs.db");
db.serialize(startup);
function startup() {
        db.run("create table sessionIDs (username NOT NULL, sessionID, timeout, constraint pk_sessionIDs PRIMARY KEY (username))", err);
        db.run("create table messages (name NOT NULL, sendersEmail, message, time NOT NULL, constraint pk_messages PRIMARY KEY (Name, time))", err);
        db.run("create table news (title NOT NULL, content, date NOT NULL, constraint pk_news PRIMARY KEY (title, date))", err);
        var title1 = "Happy Birthday Kobi";
        var content1 = "Happy birthday to my amazing Kobi.\r\n You\'ve just turned 6 and " +
          "every day you\'ve been in my life you\'ve brought me nothing but happiness. I " +
          "wish you all the belly rubs on this special day.\r\n I remember the first time I " +
          "brought you home, you were just a little ball of fur, look how much you\'ve grown. " +
          "I can\'t wait for many more happy years with you.\r\n Happy bithday my friend.";
        var ps = db.prepare("insert into news values ( ?, ?, '" + new Date() + "')", err);
        ps.run(title1, content1);
        var title2 = "Best of breed!";
        var content2 =  "Sunni and I took a trip down to the dog show today at Coalville " +
          "and District. Fairly short drive, considering the other places we have been. " +
          "After arriving we took a quick rest before the judging commenced!\r\nSunni, " +
          "looking as hansome as ever, entered the ring in the first round, which he took by " +
          "storm. He gradually progressed through the rounds before reaching the final round " +
          "of the graduate group. What did he do? He only went and won it!\r\nAfter winning " +
          "the grad event he was entered into the round for Best of Breed. He made it to the " +
          "final three! It was close between them all, but Sunni was too much for any of " +
          "them and took home first place.\r\nOur Sunni did us proud.";
        ps.run(title2, content2);
        ps.finalize();
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