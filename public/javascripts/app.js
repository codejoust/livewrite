
function handle_backspace(input_text){
	var out_text = [];
	for (var i = 0, l = input_text.length; i < l; i++){
		if (input_text[i] == '\b'){
			out_text.pop();
		} else {
			out_text.push(input_text[i]);
		}
	}
	return out_text.join('');
}

function LineWriterFunc(){
	this.curline_text = '';
	this.curline_timing = [];
	this.lines_text = [];
	this.lines_timing = [];
	this.last_time = null;

	this.liveHash = function(){
		return {
			keys: this.lines_text,
			time: this.lines_timing
		};
	}
	this.advanceLine = function(){
		this.lines_text.push(this.curline_text);
		this.curline_text = [];
		this.lines_timing.push(this.curline_timing);
		this.curline_timing = [];
	}
	this.addChar = function(charin){
		this.curline_text += charin;
		if (!this.last_time){ this.last_time = new Date().getTime(); }
		this.curline_timing.push(new Date().getTime() - this.last_time);
		this.last_time = new Date().getTime();
	}
	this.getCurline = function(){
		return handle_backspace(this.curline_text);
	}
}


function LineReplayFunc(lines_text, lines_timing, container){

	

	this.lines_text = lines_text;
	this.lines_timing = lines_timing;
	this.text_buffer = '';
	this.curline = 0;
	this.curchar = 0;
	this.container = $(container);

	this.advance = function(){
		if (!this.lines_text[this.curline]){
			return true;
		}
		if (this.lines_text[this.curline].length == this.curchar -1){
			this.curline += 1;
			this.curchar = 0;
			return false;
		} else {
			return handle_backspace(this.lines_text[this.curline].slice(0, this.curchar++));

		}
	}

	var self = this;
	this.update_html = function(){
		var new_line = self.advance();
		if (new_line == false){
			self.element = $('<p class="line"></p>');
			self.element.appendTo(self.container);
		} else if (new_line == true) {
			self.container.append('<p><small>done.</small</p>');
			return false;
		} else {
			self.element.html(new_line);
		}
		setTimeout(self.update_html, self.lines_timing[self.curline][self.curchar]);
	}

	this.go_html = function(element){
		this.update_html();
	}

}

window.render_writing = function(writing, selector, autoplay){
	var line_replay = new LineReplayFunc(writing.live.keys, writing.live.time, selector);
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
		setInterval(function(){
			cursor.className = (cursor.className == 'active') ? 'inactive' : 'active';
		}, 700);

		var getp = function(sel){ return $('#new_post').find(sel); }
		  , focus_textin = function(){
			getp('input.text_in').focus();
		};
		getp('.text').click(focus_textin);
		getp('.title').blur(focus_textin);
		getp('.writetext').click(focus_textin);

		getp('input.text_in').keydown(function(evt){
			if (evt.keyCode == 13){
				getp('button.save').fadeIn('slow');
				getp('#curline').attr('id', '').find('#cursor').remove();
				LineWriter.advanceLine();
				$('<p id="curline" class="line"><span class="text"></span><span id="cursor">&#9614;</span></p>')
					.appendTo('#writetext');
			} else if (evt.keyCode == 18 || evt.keyCode == 17 || evt.keyCode == 91 ||
					   evt.ctrlKey || evt.metaKey || evt.altKey){
				return false;
			} else {
				evt.target.value = '';
				setTimeout(function(){
					var change_value = evt.target.value;
					if (change_value == '' && evt.keyCode == 8){ change_value = '\b'; }
					LineWriter.addChar(change_value);
					getp('#curline .text').html(LineWriter.getCurline());
				}, 2);
			}
		});

		getp('.save').click(function(){
			getp('#cursor').remove();
			var lines = [];
			getp('.line').each(function(){
				lines.push($(this).text());
			});
			LineWriter.advanceLine(); // save last line
			$.post('/writing', {text: lines, title: $('.title').text(), live: LineWriter.liveHash() }, function(data){
				alert('saved with id:  ' + JSON.stringify(data));
				window.location.href = '/writing/' + data.id + '/';
			})
		});

	}
});

