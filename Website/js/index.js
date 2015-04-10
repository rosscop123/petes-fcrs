window.onload = function() {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    document.getElementById("pad_main_content").style.paddingTop = ($(window).height() - 120) + "px";
    $("#includeHeader").load("navbar.html"); 
    $("#includeSocialBar").load("socialbar.html"); 
    $("#includeGallery").load("gallery.html"); 
    $("#includeFooter").load("footer.html"); 
}
window.onresize = function(event) {
    document.getElementById("background_img").style.width = $(window).width() + "px";
    document.getElementById("pad_main_content").style.paddingTop = ($(window).height() - 120) + "px";
};