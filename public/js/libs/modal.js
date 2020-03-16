/*
Bsp:

showModal({
		titleHTML: "title",
		bodyHTML: "bodyHTML",
		okBtnText: "Ok",
		saveBtnText: "Speichern",
		onSaveClick: function(mod) { console.log("save"); },
		onOkClick: function(mod) { console.log("onOkClick"); },
		onHidden: function() { console.log("HIDDDDDDEN"); },
		beforeRender: function(mod) { console.log("can change the dom obj 'mod' if I want!"); }
	});

*/

function showModal(newOptions) {
	var options = {
		titleHTML: "title",
		bodyHTML: "bodyHTML",
		okBtnText: "Ok",
		saveBtnText: "Speichern",
		onSaveClick: null,
		onOkClick: null,
		onHidden: null,
		beforeRender: null,
		afterRender: null,
		draggable:null,
		large:null,
		backdrop:null,
		modalstyle:null
	}
	for(var i in newOptions) {
		options[i] = newOptions[i];
	}

	var lg = '';
	if(options['large'])
		lg = 'modal-lg';
	var customModalStyle= 'style="'+options["modalstyle"]+'"' || "";

	var backdrop = options["backdrop"] ?  'data-backdrop="static"' : "";

	var mod = $('<!-- Modal -->'+
	    '<div '+backdrop+' class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">'+
	      '<div '+customModalStyle+' class="modal-dialog '+lg+'" role="document">'+
	        '<div class="modal-content">'+
	          '<div class="modal-header">'+
	            '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
	            '<h4 class="modal-title myModalLabel">title</h4>'+
	          '</div>'+
	          '<div class="modal-body">'+
	            'no text!'+
	          '</div>'+
	          '<div class="modal-footer">'+
	            '<button type="button" class="modalOkBtn btn btn-default">Ok</button>'+
	            '<button type="button" class="modalSaveBtn btn btn-primary">Speichern</button>'+
	          '</div>'+
	        '</div>'+
	      '</div>'+
	    '</div>');

	$("body").append(mod);
	mod.find(".myModalLabel").html(options["titleHTML"]);
	mod.find(".modal-body").html(options["bodyHTML"]);

	if(options["okBtnText"]) {
		if(options["okBtnText"] == "hide") {
			mod.find('.modalOkBtn').hide();
		} else {
			mod.find('.modalOkBtn').text(options["okBtnText"]);
		}
	}

	if(options["saveBtnText"]) {
		if(options["saveBtnText"] == "hide") {
			mod.find('.modalSaveBtn').hide();
		} else {
			mod.find('.modalSaveBtn').text(options["saveBtnText"]);
		}
	}

	mod.on('hidden.bs.modal', function (e) {
		if(options["onHidden"]) {
			options["onHidden"]();
		}
		mod.remove();
		$(".modal-backdrop").remove();
	});

	mod.find(".modalOkBtn").click(function(evt) {
		if(options["onOkClick"]) {
			options["onOkClick"](mod);
		} else {
			mod.modal('hide');
		}
	});

	mod.find(".modalSaveBtn").click(function(evt) {
		if(options["onSaveClick"]) {
			options["onSaveClick"](mod);
		} else {
			mod.modal('hide');
		}
	});

	if(options["beforeRender"]) {
		options["beforeRender"](mod);
	}

	mod.modal('show');

	if(options["afterRender"]) {
		options["afterRender"](mod);
	}

	if(options["draggable"]) {
		mod.find(".modal-header").mousedown(draggable_modal);
		mod.find(".modal-header").css({"cursor":"move"});	
	}
}

function showErrorModal(newOptions, sendFunction) {
	showModal({
		titleHTML: newOptions["titleHTML"],
		bodyHTML: newOptions["bodyHTML"],
		okBtnText: newOptions["okBtnText"],
		onHidden: newOptions["onHidden"],
		beforeRender: function(mod) {
			mod.find(".modal-header").css("background", "#ff5f5f");
			if(!sendFunction) {
				mod.find(".modalSaveBtn").hide();
			}
		},
		saveBtnText: "Fehler senden!",
		onSaveClick: function(mod) {
			mod.modal('hide');
			note("Fehler gesendet!");
			socket.emit("sendError", newOptions["bodyHTML"]);
		}
	});
}

function draggable_modal(e){
    window.my_dragging = {};
    my_dragging.pageX0 = e.pageX;
    my_dragging.pageY0 = e.pageY;
    my_dragging.elem = $($(this).parents(".modal-dialog")[0]);
    my_dragging.offset0 = $(this).offset();
    function handle_dragging(e){
        var left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
        var top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
        $(my_dragging.elem)
        .offset({top: top, left: left});
    }
    function handle_mouseup(e){
        $('body')
        .off('mousemove', handle_dragging)
        .off('mouseup', handle_mouseup);
    }
    $('body')
    .on('mouseup', handle_mouseup)
    .on('mousemove', handle_dragging);
}