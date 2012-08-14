
function format_text(input_text){
	var out_text = ['<p class="line">'];
	for (var i = 0, l = input_text.length; i < l; i++){
		if (input_text[i] == '\b' && i-1 >= 0 && input_text[i-1] != "\n"){
			out_text.pop();
		} else if (input_text[i] == "\n") {
			out_text.push('</p><p class="line">');
		} else {
			out_text.push(input_text[i]);
		}
	}
	out_text.push('<span id="cursor">&#9614;</span></p>');
	return out_text.join('');
}

function LineWriterFunc(){
	this.writing_text = '';
	this.writing_timing = [];
	this.last_time = null;

	this.liveHash = function(){
		return {
			keys: this.writing_text,
			time: this.writing_timing
		};
	}
	this.addChar = function(charin){
		this.writing_text += charin;
		if (!this.last_time){ this.last_time = new Date().getTime(); }
		this.writing_timing.push(new Date().getTime() - this.last_time);
		this.last_time = new Date().getTime();
	}
	this.getCurline = function(){
		return format_text(this.writing_text);
	}
}


function LineReplayFunc(writing_text, writing_timing, container){

	this.writing_text = writing_text;
	this.writing_timing = writing_timing;
	this.text_buffer = '';
	this.curchar = 0;
	this.speed = 1;
	this.container = $(container);

	this.advance = function(){
		if (this.curchar == this.writing_text.length){
			return true;
		} else {
			return format_text(this.writing_text.slice(0, this.curchar++));
		}
	}

	var self = this;
	this.update_html = function(){
		var new_line = self.advance();
		if (new_line == true) {
			$.post('/writing/'+$('.writing').attr('mid')+'/view', function(){
				$('.views_counter').html(writing.views + 1);
			});

			self.container.append('<p><small>done.</small</p>');
			return false;
		} else {
			self.element.html(new_line);
		}
		setTimeout(self.update_html, Math.floor(self.writing_timing[self.curchar] * (1/self.speed)) );
	}

	this.go_html = function(element){
		this.element = $('<div class="writing_out"></div>');
		this.element.appendTo(this.container);
		$('.speed').click(function(){
			$('.speed').removeClass('selected');
			$(this).addClass('selected');
			self.speed = parseFloat($(this).attr('speed'));
		})
		this.update_html();
	}

}

window.render_writing = function(writing, selector, autoplay){
	window.writing = writing;
	window.line_replay = new LineReplayFunc(writing.live.keys, writing.live.time, selector);
	$(selector).html('');
	if (autoplay){
		line_replay.go_html();
	}

}

$(function(){

	  // \\
	 //...\\
	// ... \\



	if ($('#new_post').length){


		var LineWriter = new LineWriterFunc();
		window.LineWriter = LineWriter;

		var cursor = document.getElementById('cursor');
		if (cursor){
			setInterval(function(){
				cursor.className = (cursor.className == 'active') ? 'inactive' : 'active';
			}, 700);
		}

		var getp = function(sel){ return $('#new_post').find(sel); }
		  , focus_textin = function(){
			getp('input.text_in').focus();
		};

		getp('button.clear').click(function(){
			window.location.reload();
		});

		getp('.text').click(focus_textin);
		getp('.title').blur(focus_textin);
		getp('.writetext').click(focus_textin);
		getp('input.text_in').focus(function(evt){
			getp('.buttons').show('fast');
		})
		getp('input.text_in').keydown(function(evt){
			if (false && evt.keyCode == 13){
				//getp('button.save').fadeIn('slow');
				//getp('#curline').attr('id', '').find('#cursor').remove();
				//LineWriter.advanceLine();
				//$('<p id="curline" class="line"><span class="text"></span><span id="cursor">&#9614;</span></p>')
				//	.appendTo('#writetext');
			} else if (evt.keyCode == 18 || evt.keyCode == 17 || evt.keyCode == 91 ||
					   evt.ctrlKey || evt.metaKey || evt.altKey){
				return false;
			} else {
				evt.target.value = '';
				setTimeout(function(){
					var change_value = evt.target.value;
					if (change_value == '' && evt.keyCode == 8) { change_value = '\b'; }
					if (change_value == '' && evt.keyCode == 13){ change_value = '\n'; }
					LineWriter.addChar(change_value);
					getp('.writer_out').html(LineWriter.getCurline());
				}, 2);
			}
		});

		getp('.save').click(function(){
			getp('#cursor').remove();
			var lines = [];
			getp('.line').each(function(){
				lines.push($(this).text());
			});
			$.post('/writing', {text: lines, title: $('.title').val(), live: LineWriter.liveHash() }, function(data){
				alert('saved with id:  ' + JSON.stringify(data));
				window.location.href = '/writing/' + data.id + '/';
			})
		});

	}
});
