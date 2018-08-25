/*
********************************************************************************
PROJECT:      Splash!
FILE:         splash.js
DESCRIPTION:  Main JS file for splash
AUTHOR:       aldreneo aka slyfox, mrtech, Franklin DM
LICENSE:      GNU GPL (General Public License)
--------------------------------------------------------------------------------
Copyright (c) 2006 aldreneo aka slyfox and mrtech
Copyright (c) 2017 Franklin DM
********************************************************************************

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ctypes.jsm");

var splash = {
    init: function () {
        var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
        var prefBranch = prefService.getBranch("extensions.splash.");
        var splashWindow = document.getElementById("splashscreen"),
        splashImg = document.getElementById("splash.image"),
        splashBox = document.getElementById("splashBox"),
        splashTxt = document.getElementById("splash.text"),
        splashProgMeter = document.getElementById("splash.progressMeter"),
        splashURL,
        alwaysOnTop = prefBranch.getBoolPref("alwaysOnTop"),
        useTransparency = true;

        // custom handling for background transparency
        // Pale Moon & FossaMail don't exhibit the transparency bug (yet to be filed)
        // When the background is set to transparent, other browsers don't show the window or show a black square with nothing inside it
        switch (splash.getAppName()) {
        case "Pale Moon":
            if (Services.vc.compare(Services.appinfo.version, 28) > 0 || Services.vc.compare(Services.appinfo.version, "28.0.0a1") >= 0)
                useTransparency = false;
            break;
        case "FossaMail":
            break;
        default:
            useTransparency = false;
            break;
        }

        if (alwaysOnTop)
            splash.setAlwaysOnTop(true);

        if (useTransparency) {
            splashWindow.setAttribute("style", "background-color: transparent;" + prefBranch.getCharPref("windowStyle"));
        } else {
            splashWindow.setAttribute("style", prefBranch.getCharPref("windowStyle"));
        }

        // If the imageURL is the default value and we are running Thunderbird,
        // we need to change the default about image location
        if (prefBranch.prefHasUserValue("imageURL")) {
            splashURL = prefBranch.getCharPref("imageURL");
        } else {
            splashURL = splash.getDefaultImage();
            prefBranch.setCharPref("imageURL", splashURL);
        }

        splashImg.src = splashURL;
        splashImg.height = prefBranch.getIntPref("windowHeight");
        splashImg.width = prefBranch.getIntPref("windowWidth");

        var bgColor = prefBranch.getCharPref("bgcolor");
        if (bgColor) {
            if (!useTransparency && bgColor.toLowerCase() == "transparent")
                bgColor = "-moz-Dialog";
            splashBox.setAttribute("style", "background-color: " + bgColor)
        }

        var trans = prefBranch.getBoolPref("trans");
        if (trans) {
            splashImg.style.opacity = prefBranch.getCharPref("transvalue_img");
            splashTxt.style.opacity = prefBranch.getCharPref("transvalue_txt");
            splashBox.style.opacity = prefBranch.getCharPref("transvalue_box");
            splashProgMeter.style.opacity = prefBranch.getCharPref("transvalue_mtr");
        }

        if (!prefBranch.getBoolPref("textHide")) {
            var txColor = prefBranch.getCharPref("txtcolor");
            if (txColor) {
                txColor = ";color: " + txColor;
            }

            splashTxt.setAttribute("style", prefBranch.getCharPref("textStyle") + txColor);

            var textOverride = prefBranch.getCharPref("textOverride");
            if (textOverride) {
                textOverride = textOverride.replace(/{appVersion}/ig, Services.appinfo.version);
                textOverride = textOverride.replace(/{buildID}/ig, Services.appinfo.appBuildID);
                textOverride = textOverride.replace(/{userAgent}/ig, navigator.userAgent);

                splashTxt.value = textOverride;
            }
            splashTxt.hidden = false;
        }

        if (!prefBranch.getBoolPref("progressMeterHide")) {
            splashProgMeter.hidden = false;
        }

        setTimeout(window.close, prefBranch.getIntPref("timeout"));
    },

    getAppName: function () {
        var myBrandingPath = null;
        var myStringBundleService = Cc["@mozilla.org/intl/stringbundle;1"]
            .getService(Ci.nsIStringBundleService);

        if (typeof Ci.nsIXULAppInfo == "undefined") {
            myBrandingPath = "chrome://global/locale/brand.properties"
        } else {
            myBrandingPath = "chrome://branding/locale/brand.properties"
        }

        var myBrandStrings = myStringBundleService.createBundle(myBrandingPath);

        return myBrandStrings.GetStringFromName("brandShortName");
    },

    getDefaultImage: function () {
        var splashDefaultURL;

        switch (splash.getAppName()) {
        case "Thunderbird":
            splashDefaultURL = "chrome://branding/content/about-thunderbird.png";
            break;
        default:
            splashDefaultURL = "chrome://branding/content/about.png";
        }
        return splashDefaultURL;
    },

    setAlwaysOnTop: function (topmost) {
        try {
            let lib = ctypes.open("user32.dll");
            let getActiveWindow = 0;

            try {
                getActiveWindow = lib.declare("GetActiveWindow", ctypes.winapi_abi, ctypes.int32_t);
            } catch (e) {
                getActiveWindow = lib.declare("GetActiveWindow", ctypes.stdcall_abi, ctypes.int32_t);
            }

            if (getActiveWindow != 0) {
                let setWindowPos = 0;
                try {
                    setWindowPos = lib.declare("SetWindowPos",
                            ctypes.winapi_abi,
                            ctypes.bool,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.uint32_t);
                } catch (e) {
                    setWindowPos = lib.declare("SetWindowPos",
                            ctypes.stdcall_abi,
                            ctypes.bool,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.int32_t,
                            ctypes.uint32_t);
                }

                // Determine whether to set the window as always on top
                let HWND = -2;
                if (topmost)
                    HWND = -1;

                setWindowPos(getActiveWindow(), HWND, 0, 0, 0, 0, 19);
            }

            lib.close();
        } catch (e) {}
    }
};
