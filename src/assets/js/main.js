$(function() {
    'use strict';

    /*    change bg nav and animate on scroll */
    $(document).scroll(function() {
        if ($(document).scrollTop() > 20) {

            $(".navbar .click").css({ "border-color": "#000" });
            $(".navbar .click span").css({ "background": "#000" });
            $(".navbar .logo .lan").css({ "opacity": "1" });
            $("#brand").removeClass("brand");
        } else {

            $(".navbar .click").css({ "border-color": "#fff" });
            $(".navbar .click span").css({ "background": "#fff" });

            $(".navbar .logo .lan").css({ "opacity": "0" });
            $("#brand").addClass("brand");
        }
    });
    $('.menu a').on('click', function() {
        event.preventDefault();
        var mySection = $(this).attr("id");
        $(this).addClass('active').siblings().removeClass('active');

        /* 
        $('html, body').animate({
             scrollTop: $('#' + mySection + '-content').offset().top
         }, 1000);
         */
    });
    /*  $('#moree').on('click', function() {
          setTimeout(function() {

              $(".moree .skills .progresss ul li .prog_bar .percent").removeClass("prog_width");


          }, 2000);
      });
      */

    $(document).on('scroll', function() {
        if ($(this).scrollTop() >= $('#skillss').position().top) {
            $(".moree .skills .progresss ul li .prog_bar .percent").removeClass("prog_width");
        } else {
            $(".moree .skills .progresss ul li .prog_bar .percent").addClass("prog_width");
        }
    });
    /*    end change bg nav and animate on scroll */


    // animate prog while scroll 

    // inputs 
    $(".first-name input").on("focusout", function() {
        if ($(this).val() != "") {
            $(".first-name label").addClass("has-data");
        } else {
            $(".first-name label").removeClass("has-data");
        }
    });
    $(".last-name input").on("focusout", function() {
        if ($(this).val() != "") {
            $(".last-name label").addClass("has-data");
        } else {
            $(".last-name label").removeClass("has-data");
        }
    });
    $(".email input").on("focusout", function() {
        if ($(this).val() != "") {
            $(".email label").addClass("has-data");
        } else {
            $(".email label").removeClass("has-data");
        }
    });
    $(".phone input[type=number]").on("focusout", function() {
        if ($(this).val() != "") {
            $(".phone label").addClass("has-data");
        } else {
            $(".phone label").removeClass("has-data");
        }
    });
    $(".password input").on("focusout", function() {
        if ($(this).val() != "") {
            $(".password label").addClass("has-data");
        } else {
            $(".password label").removeClass("has-data");
        }
    });
    $(".repassword input").on("focusout", function() {
        if ($(this).val() != "") {
            $(".repassword label").addClass("has-data");
        } else {
            $(".repassword label").removeClass("has-data");
        }
    });
    $("#theme-click").on("click", function() {
        $(this).toggleClass("theme-click-1");
        $(".theme-click .i2").toggleClass("i22");
        $(".themes-menu").toggleClass("themes-1");

    });

    $(".themes-menu .list div").on("click", function() {
        $(".themes-menu").removeClass("themes-1");
        $("#theme-click").removeClass("theme-click-1");
        $(".theme-click .i2").removeClass("i22");
        $("body").attr("data-default-color", $(this).data("color"));

    });

    $("#dark").on("click", function() {
        $("body").attr("data-dark", "dark");
        $("body").css({ "background": "#000" });
        $(".themes-menu").removeClass("themes-1");
        $("#theme-click").removeClass("theme-click-1");
        $(".theme-click .i2").removeClass("i22");
    });
    $("#light").on("click", function() {
        $("body").removeAttr("data-dark", "dark");
        $("body").css({ "background": "#fff" });
        $(".themes-menu").removeClass("themes-1");
        $("#theme-click").removeClass("theme-click-1");
        $(".theme-click .i2").removeClass("i22");
    });

    // pre loader
    $(window).on('load', function() {
        $("#loading").fadeOut(1000, function() {
            $(this).remove();
        });
    });
});