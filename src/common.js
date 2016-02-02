Mobilebone.captureLink = false;
var _host = "http://192.168.10.105/accountant/customer/v1/";
//controller 对象缓存
var controllerCache = {};
//底部按钮
var active_bar;

function reLogin(){
	window.location.href = "http://192.168.10.105/mb/login.html";
}

function isNullObject(obj){
	var o;
	for(o in obj){
		return false;
	}
	return true;
}

function toggleBar(id){
	$(active_bar).css("backgroundColor","#fff");
	var othis = $("#"+id);
	othis.css("backgroundColor","#eee");
	active_bar = othis;
}

function keyContains(key,obj){
	var o;
	for(o in obj){
		if(o == key){
			return true;
		}
	}
	return false;
}

function _clone(myObj){  
    if(typeof(myObj) != 'object' || myObj == null) return myObj;  
    var newObj = new Object();  
    for(var i in myObj){  
      newObj[i] = _clone(myObj[i]); 
    }  
    return newObj;  
}

function valueContains(value,obj){
	var v;
	for(v in obj){
		if(v == value){
			return true;
		}
	}
	return false;
}

function awesome(controller,data){
	if(typeof data == "undefined"){
		throw "awesome:data can not be null";
	}
	if(Object.prototype.toString.call(data) === '[object Array]'){
		if(data.length == 0){
			data = [{}];
		}
	}
	if(Object.prototype.toString.call(data) === '[object Object]'){
		data = [data];
	}

	var control,unique_id = controller+"_midie";
	if(!keyContains(controller,controllerCache)){
		control = $("*[a-controller="+controller+"]");
		if(control.length){
			control = control.eq(0);
			control.attr("id",unique_id);
			controllerCache[controller] = control.html().slice();
		}
	}
	if(1){
		var regArr = {},
			html = controllerCache[controller].slice(),
			reg = new RegExp("[{]{2}\\s*[a-z_0-9]+\\s*[}]{2}","gi"),
			m_result = html.match(reg),
			divArr = [];
		// console.log("final controller html",html);
		if(m_result != null){
			for(var i = 0,len = m_result.length;i < len;i++){
				var key = m_result[i];
				var value = key.match(/[a-z0-9_]+/);
				value = value[0];
				regArr[key] = value;
			}
			data.forEach(function(ele,index){
				var r , _html = html.slice();
				for(r in regArr){
					var r_value = ele[regArr[r]];
					if(r_value == null){
						r_value = "";
					}
					_html = _html.replace(new RegExp(r,'g'),r_value);
				}
				divArr.push(_html);
			});
			var finalHtml = divArr.join("\n");
			if(!isNullObject(data[0])){
				$("#"+unique_id).empty().html(finalHtml);	
			}else{
				$("#"+unique_id).empty();
			}
		}else{
			throw "no regexp model match";
		}
	}
}
function registerBusiness(id){
	registerClick(id,function(othis){
		toggleBar(id);
		$.post(_host+"business/get",function(r){
			var errorCode = r.error_code,
				data;

			if(errorCode == 0){
				if(r.data.length > 0){
					data = r.data;
					data.forEach(function(ele,index){
						var tag = ele.business_name;
						switch(tag){
							case "register":
								data[index]["business_name"] = "工商注册";
								break;
							case "change":
								data[index]["business_name"] = "工商变更";
								break;
							case "logout":
								data[index]["business_name"] = "工商注销";
								break;
							default:
								break;
						}
					});
				}
				awesome("business",data);
				awesome('business-employee',r.employee);
			}
		});
	});
}
function registerAccounting(id){
	registerClick(id,function(othis){
		toggleBar(id);
		$.post(_host+"accounting/get",function(r){
			var errorCode = r.error_code,
				data = r.data;
			if(errorCode == 0){
				if(typeof data.diff != "undefined"){
					var diff = parseInt(data.diff);
					if(diff > 0){
						$("#employee-positive").show();
					}else{
						$("#employee-negative").show();
					}
					data.diff = Math.abs(diff);
				}else{
					$("#accounting-no-reocrd").show();
				}
				awesome("accounting",data);
			}
		});
	});
}

function registerTax(id){
	registerClick(id,function(othis){
		toggleBar(id);
		requestTax();
	});
}

function closeSuspension(othis){
	var parent = $(othis).parent().parent().fadeOut();
}
function registerClick(id,fn){
	if(typeof id != "undefined"){
		if(id.indexOf("#") < 0){
			id = "#"+id;
		}
		var target = $(id);
		target.bind("click",fn);
	}else{
		throw "id not be null";
	}
}

$(document).ready(function(){
	registerBusiness("business");
	registerAccounting("accounting");
	registerTax("tax");
	$("#business").trigger("click");
	//请求公司名
	requestCompany();
	//红点
	requestMsgCount();
});

function showSuspension(businessId,businessName){
	$("#suspension-business").fadeIn();
	$("#suspension-title-text").text(businessName);
	requestProgress(businessId);
}

function requestTax(){
	var year = $("#tax-year").val();
	var month = $("#tax-month").val();

	$.post(_host+"tax/get",{"year":year,"month":month},function(r){
		var errorCode = r.error_code,
			data = r.data;
		if(errorCode == 0){
			if(data.length == 0){
				$("#tax-no-record").show();
				$("#tax-body").hide();
				awesome("count",{"nation":r.nation,"local":r.local});
			}else{
				$("#tax-no-record").hide();
				$("#tax-body").show();
				awesome("count",{"nation":r.nation,"local":r.local});
				awesome("tax",r.data);
			}
		}
	});
}

function requestProgress(businessId){
	$.post(_host+"progress/get",{"business_id":businessId},function(r){
		var errorCode = r.error_code;
		if(errorCode == 0){
			awesome("progress",r.data);
		}
	});
}

function reloadTax(){
	requestTax();
}

function morePayrecord(){
	alert(1);
}

function showMsg(readed){
	$.post(_host+"msg/get",{'readed':readed},function(r){
		var errorCode = r.error_code,
			data = r.data;
		if(errorCode == 0){
			data.forEach(function(ele,index){
				data[index].index = index+1;
			});
			if(data.length == 0){
				$("#msg-no-record").fadeIn();	
			}else{
				$("#msg-no-record").fadeOut();
			}
			awesome("msg",data);
		}
		$("#suspension-msg").fadeIn();
	});
}

function showMenu(){
	$("#drawer-menu").fadeIn();
	$("#drawer-menu-inner").animate({
		"left":0
	});
}
function hideMenu(othis){
	$(othis).fadeOut();
	$("#drawer-menu-inner").animate({
		"left":"-80%"
	});
}

function editPassword(){
	var old_pass = $("#old-pass").val(),
		new_pass = $("#new-pass").val(),
		repeat_pass = $("#repeat-pass").val();

	if(old_pass.length < 6){
		alert("原密码格式不正确");
	}else{
		if(new_pass.length < 6 && repeat_pass.length < 6){
			alert("新密码格式不正确");
		}else if(new_pass != repeat_pass){
			alert("两次输入密码不相符");
		}else{
			$.post(_host+"guest/put",{
				"old_pass":old_pass,
				"new_pass":new_pass
			},function(r){
				var errorCode = r.error_code;
				if(errorCode == 0){
					alert("密码修改成功");
					setTimeout(function(){
						$.post(_host+"logout/get");
						reLogin();
					},100);
				}else{
					switch(errorCode){
						case 1:
							alert('登录超时，请先登录');
							reLogin();
							break;
						case 12:
							alert("修改密码失败");
							break;
						case 11:
							alert("密码格式不正确");
							break;
						default:
							console.log(errorCode);
							break;
					}
				}
			});
		}
	}
}

function logout(){
	$.post(_host+"logout/get");
	reLogin();
}

function requestCompany(){
	$.post(_host+"company/get",function(r){
		if(r.error_code == 0){
			$("#company").html(r.data.company);
		}		
	});
}

function requestMsgCount(){
	$.post(_host+"msgcount/get",function(r){
		if(r.error_code == 0){
			if(r.data != 0){
				$("#msg-point").text(r.data).fadeIn();
			}
		}		
	});
}

function cleanMsgPoint(othis){
	$(othis).hide();
	//send
}
