
var dialogCloseBtn = function(text) {
	return  {
	    text: text,
	    click: function() { $(this).dialog("close"); }
	};
}

var OK_DIALOG = dialogCloseBtn("Ok");
var CANCEL_DIALOG = dialogCloseBtn("Cancel");
var CLOSE_DIALOG = dialogCloseBtn("Close");

function checkAccount(test,checkid, form) {
	var querier = form == null ? 
			function(name) {
				return $(name);
			} : function (name) {
				return form.find(name);
			}
	;
	querier("#" + checkid + "Check").html("<img src='/img/checking.gif' height='15' />");
	$.post("/GuestServlet?action=accountExists",{user:querier("[name=" + checkid + "]").val()},function(data) {
		if (data==''+ test) {
			querier("#" + checkid + "Check").html("<img src='/img/correct.jpg' height='15' />" + (test?"" : "Tài khoản chưa tồn tại"));
		} else if (data==''+ !test) {
			querier("#" + checkid + "Check").html("<img src='/img/wrong.jpg' height='15' />" + (test?"Tài khoản ko tồn tại" : "Tài khoản đã tồn tại"));
		} else {
			querier("#" + checkid + "Check").html("<img src='/img/wrong.jpg' height='15' /> " + data);
		}
	},"html")
}







// core.js


function addCommas(str) {
	if (typeof str == "string") {
		str = parseFloat(str);
	}
	
	if (str % 1 != 0) {
		str = str.toFixed(2);
	}
    var amount = new String(str);
    amount = amount.split(".");
    return addCommasInt(amount[0]) + (amount.length > 1 ? "." + amount[1] : "");
}
function addCommasInt(str) {
    var amount = new String(str);
    amount = amount.split("").reverse();

    var output = "";
    for ( var i = 0; i <= amount.length-1; i++ ){
        output = amount[i] + output;
        if (amount[i+1]=='-') {
        	continue;
        }
        if ((i+1) % 3 == 0 && (amount.length-1) !== i)output = ',' + output;
    }
    return output;
}

function randomString(length, special) {
   var iteration = 0;
   var randomString = "";
   var randomNumber;
   if(special == undefined){
       var special = false;
   }
   while(iteration < length){
       randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
       if(!special){
           if ((randomNumber >=33) && (randomNumber <=47)) { continue; }
           if ((randomNumber >=58) && (randomNumber <=64)) { continue; }
           if ((randomNumber >=91) && (randomNumber <=96)) { continue; }
           if ((randomNumber >=123) && (randomNumber <=126)) { continue; }
       }
       iteration++;
       randomString += String.fromCharCode(randomNumber);
   }
   return randomString;
}

function formatDate(time) {
	var date = new Date(time);
	return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
}
function formatTime(time) {
	var date = new Date(time);
	return formatDate(time) + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}
function formatN(original) {
	return Math.round(original*100)/100;
}

function dialogWarning(text) {
	return $("<p/>").html(
		"<span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>"+
		text);
}

var JSON = JSON || {};
//implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") obj = '"'+obj+'"';
        return String(obj);
    }
    else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n]; t = typeof(v);
            if (t == "string") v = '"'+v+'"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};
//implement JSON.parse de-serialization
JSON.parse = JSON.parse || function (str) {
    if (str === "") str = '""';
    eval("var p=" + str + ";");
    return p;
};


$(function() {
	$(".lazy").each(function () {
		var div = $(this);
		var hidecheck = div.attr("hidecheck");
		if (hidecheck) {
			$.post(hidecheck,{},function(data) {
				if (!data.result) {
					div.css("display","block");
				}
			},"json");
		}
	});
});

function show(id) {
	var div = $("#" + id);
	var display = div.css("display");
	if (display=="none") {
		var url = div.attr("url");
		if (url!=null) {
			$.get(url, function(data) {
				div.html(data);
				div.slideDown('slow');
				div.removeAttr();
			}, "html");
		} else {
			div.slideDown('slow');
		}
	} else {
		div.slideUp('slow');
	}
}

function p0(f, param) {
	return function () {
		f(param);
	};
}

function addMap(target, map) {
	for (key in target) {
		map[key] = target[key];
	}
	return map;
}

function checking(comp, text) {
	comp.html("<img src='/img/checking.gif' height='15' />" + (text? " " + text : ""));
}
function correct(comp, text) {
	comp.html("<img src='/img/correct.jpg' height='15' />" + (text? " " + text : ""));
}
function wrong(comp, text) {
	comp.html("<img src='/img/wrong.jpg' height='15' />" + (text? " " + text : ""));
}

function wrongF(comp) {
	return function (data,textStatus, errorThrown) {
		wrong(comp, textStatus);
	};
}

function postJson(url, values, onSuccess, onError) {
	if ("function"==(typeof onError)) {
		;
	} else if (onError) {
		checking(onError);
	}
	
	var customizedOnError = function(errorThrown) {
		if (onError==null) {
			;
		} else if ("function"==(typeof onError)) {
			onError(errorThrown);
		} else {
			wrong(onError, errorThrown);
		}
	};
	$.ajax({
		type: 'POST',
		url: url,
		data: values,
		success: function(data, textStatus, jqXHR) {
			if (data==null) {
				customizedOnError("Invalid server response");
			} else {
				onSuccess(data);
			}
		},
		error: function(data,textStatus, errorThrown) {
			customizedOnError(errorThrown);
		},
//		complete: function (jqXHR, textStatus) {
//			alert("complete");
//		},
//		dataFilter: function(data, type) {
//			alert("dataFilter");
//		},
		dataType: "json"
	});
}

function ceil (num) {
	return Math.ceil(num * 100) / 100;
}

function allNumbers(val) {
	return val.replace(/\D/g, "");
}
function allWords(val) {
	return val.replace(/\W/g, "");
}

function isBlank(val) {
	return val==null || val.replace(/\s/g, "").length == 0;
}

function isEmpty(val) {
	return isBlank(val);
}

function trim(val) {
	if (!val) {
		return null;
	}
	
	return val.replace(/^\s+/, "").replace(/\s+$/, "");
}