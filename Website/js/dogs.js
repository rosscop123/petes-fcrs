window.onload = function() {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
    $("#includeHeader").load("navbar.html"); 
    $("#includeSocialBar").load("socialbar.html"); 
    $("#includeGallery").load("gallery.html"); 
    $("#includeFooter").load("footer.html"); 
    $('.responsive').slick({
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 2,
        slidesToScroll: 2,
        responsive: [{
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            }, {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            }, {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
    var jsonFile = 'Website.json';
    $.getJSON(jsonFile, function(content) {
        if(content.user != 'guest'){
           document.getElementById("userWelcomeInner").innerHTML += content.user + ' (<a href="http://www.petesfcrs.com/?logout=true">Logout</a>)';
        } else {
           document.getElementById("userWelcomeInner").innerHTML += content.user; //+ 
                // ' (<a href="/login.html">Login</a>/<a href="/signUp.html">Sign Up</a>)';
        }  
    });
}
window.onresize = function(event) {
    document.getElementById("background_img").style.backgroundSize = $(window).width() + "px ";
};
function openGallery(image, tag){
	document.getElementById('image').innerHTML = '<img src="' + image + '" alt="' + tag + '" class="round_edges large_image" />';
	document.getElementById("gallery").className += " active";
}
function closeGallery(){
	document.getElementById("gallery").className = "modal";
}