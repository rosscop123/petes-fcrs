window.onload = function() {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    $("#includeHeader").load("navbar.html"); 
    $("#includeSocialBar").load("socialbar.html"); 
    $("#includeGallery").load("gallery.html"); 
    $("#includeFooter").load("footer.html"); 
    var jsonFile = 'Website.json';
	$.getJSON(jsonFile, function(content) {
        if(content.user != 'guest'){
    	   document.getElementById("userWelcomeInner").innerHTML += content.user + ' (<a href="http://www.petesfcrs.com/?logout=true">Logout</a>)';
	    } else {
           document.getElementById("userWelcomeInner").innerHTML += content.user; //+ 
                // ' (<a href="/login.html">Login</a>/<a href="/signUp.html">Sign Up</a>)'; 
        }  
    });
    getUrlQueries();
    var Name = new LiveValidation( "nameField");
    Name.add( Validate.Presence);
    var Email = new LiveValidation( "emailField");
    Email.add( Validate.Presence);
    Email.add( Validate.Email);
    var Message = new LiveValidation( "messageField");
    Message.add( Validate.Presence);
};
window.onresize = function(event) {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
};
function getUrlQueries()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    hash = hashes[0].split('=');
    if(hash[0] == "submitContactFailed"){
        document.getElementById("formFailure").style.visibility = 'visible';
        document.getElementById("failureReason").innerHTML = hash[1].substring(7);
    }
}