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
                // ' (<a href="/signUp.html">Sign Up</a>)'; 
        }  
    });
    getUrlQueries();
    var Username = new LiveValidation( "usernameField");
    Username.add( Validate.Presence);
    var Password1 = new LiveValidation( "passwordField");
    Password1.add( Validate.Presence);
};
window.onresize = function(event) {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
};
function getUrlQueries()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    hash = hashes[0].split('=');
    if(hash[0] == 'loginFailed' && hash[1] == 'true'){
    	document.getElementById("formFailure").style.visibility = 'visible';
    }
}