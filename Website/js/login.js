window.onload = function() {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    $("#includeHeader").load("navbar.html"); 
    $("#includeSocialBar").load("socialbar.html"); 
    $("#includeGallery").load("gallery.html"); 
    $("#includeFooter").load("footer.html");
    getUrlQueries();
};
window.onresize = function(event) {
    document.getElementById("background_img").style.width = $(window).width() + "px";
};
function getUrlQueries()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    hash = hashes[0].split('=');
    if(hash[0] == 'loginFailed' && hash[1] == 'true'){
    	document.getElementById("loginFailure").style.visibility = 'visible';
    }
}