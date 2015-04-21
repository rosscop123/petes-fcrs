window.onload = function() {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    $("#includeHeader").load("navbar.html"); 
    $("#includeSocialBar").load("socialbar.html"); 
    $("#includeGallery").load("gallery.html"); 
    $("#includeFooter").load("footer.html"); 
    var jsonFile = 'Website.json';
	$.getJSON(jsonFile, function(content) {
        if(content.user != 'guest'){
    	   document.getElementById("userWelcomeInner").innerHTML += content.user + ' (<a href="/?logout=true">Logout</a>)';
	    } else {
           document.getElementById("userWelcomeInner").innerHTML += content.user + ' (<a href="/login.html">Login</a>)'; 
        }  
    });
};
window.onresize = function(event) {
    document.getElementById("background_img").style.width = $(window).width() + "px";
};