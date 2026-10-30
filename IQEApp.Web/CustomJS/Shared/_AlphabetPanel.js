
function Objserver() {
    this.observer = null;
    this.add = function (obsr) {
        this.observer = obsr;
    },
    this.get = function () {
        return this.observer;
    }
}

function AlphaSearchObserver() {
    this.update = function () {
        console.log("OLD observer called");
    }
}

function AlphaSearchSubject() {

    this.observer = new Objserver();

    this.notify = function (data) {
        this.observer.get().update(data);
    }
    this.AddObserver = function (obsr) {
        this.observer.add(obsr);
    }
}

//function to extend the behaviour
function extend(obj, extension) {
    for (var key in extension) {
        obj[key] = extension[key];
    }
}

var AlphaSearchObj = (function () {
    var AlphaSearchSubjectObj = new AlphaSearchSubject();

    return {
        getAlphaSearchSubjectObj: function () {
            return AlphaSearchSubjectObj;
        },
        subscribe: function (callback) {
            //alpha search configuration
            var alphaObserver = new AlphaSearchObserver();
            alphaObserver.update = callback;
            //now let our observer be subscribed to aphabet panel Subject
            this.getAlphaSearchSubjectObj().AddObserver(alphaObserver);
        }
    };
}());

$(document).ready(function () {
    var alphabets = document.getElementsByClassName("alphasearch");
    for (var ind in alphabets) {
        var alpha = alphabets[ind];
        //extend the alpha anchor element to get the Subject's behaviour
        extend(alpha, AlphaSearchObj.getAlphaSearchSubjectObj());
        alpha.onclick = function () {
            //if element already has the class, then remove the class
            if ($(this).hasClass("selectedStartsWithChar")) {
                //$(this).removeClass("selectedStartsWithChar");
                $(".selectedStartsWithChar").removeClass("selectedStartsWithChar");
            }
            else {
                $(".selectedStartsWithChar").removeClass("selectedStartsWithChar");
                $(this).addClass("selectedStartsWithChar");
            }
            alpha.notify(this.innerHTML);
        }
    }
});
