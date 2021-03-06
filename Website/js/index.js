window.onload = function() {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    var img_height = ($(window).width()*0.5841);
    var content_height = $(window).height() - 120;
    if(img_height < content_height){
        document.getElementById("pad_main_content").style.paddingTop = img_height + "px";
    }
    else{
        document.getElementById("pad_main_content").style.paddingTop = content_height + "px";
    }
    $("#includeHeader").load("navbar.html"); 
    $("#includeSocialBar").load("socialbar.html"); 
    $("#includeGallery").load("gallery.html"); 
    $("#includeFooter").load("footer.html"); 
    var jsonFile = 'Website.json';
	$.getJSON(jsonFile, function(content) {
        if(content.user != 'guest'){
    	    document.getElementById("userWelcomeInner").innerHTML += content.user + ' (<a href="http://www.petesfcrs.com/?logout=true">Logout</a>)';
            document.getElementById("addNews").style.display = "block";
	    } else {
           document.getElementById("userWelcomeInner").innerHTML += content.user; //+ 
                // ' (<a href="/login.html">Login</a>/<a href="/signUp.html">Sign Up</a>)'; 
        }  
    });
    var jsonFile = 'News.json';
    $.getJSON(jsonFile, function(content) {
        for(var i = 0; i<content.length; i++){
            var message = content[i].content;
            message = message.replace(/\r\n/g, "</p><p>")
            document.getElementById("title"+i).innerHTML = content[i].title; 
            document.getElementById("content"+i).innerHTML = "<p>" + message + "</p>"; 
            if(content[i].imgDir != null){            
                document.getElementById("img"+i).innerHTML = '<img src="' +
                    content[i].imgDir + '" alt="' + content[i].imgDir + '" />';
            } else{
                document.getElementById("img"+i).style.display = 'none';
            }
        }
    });
}
window.onresize = function(event) {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    var img_height = ($(window).width()*0.5841);
    var content_height = $(window).height() - 120;
    if(img_height < content_height){
        document.getElementById("pad_main_content").style.paddingTop = img_height + "px";
    }
    else{
        document.getElementById("pad_main_content").style.paddingTop = content_height + "px";
    }
};