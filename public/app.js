;

$(function() {
	$("#mode_map").click(function(e) {
		e.preventDefault();
		$("#radar").hide();
		$("#map").show();
	});

	$("#mode_radar").click(function(e) {
		e.preventDefault();
		$("#map").hide();
		$("#radar").show();
	});

	var radar_image_url = "images/radar-306289_640.png";
	var radar_image_obj = null;
	var ctx = null;

	function init_canvas() {
		var canvas = document.getElementById('radar_canvas');
		/* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
		if (!canvas || !canvas.getContext ) {
			return false;
		}
		/* 2Dコンテキスト */
		ctx = canvas.getContext('2d');

		radar_image_obj = new Image();
		radar_image_obj.onload = function() {
			console.log("image loaded.");
		};
		radar_image_obj.src = radar_image_url;
	}

	window.showRadar = function (data) {
		if (!ctx || !radar_image_obj) { return; }
		var divwidth = $('#radar_canvas').width();
		var divheight = $('#radar_canvas').height();
		var iwidth = Math.floor(((divwidth < divheight) ? divwidth : divheight) * 0.5);

console.log(divwidth, divheight, iwidth);
		ctx.drawImage(radar_image_obj,
			(divwidth - iwidth) / 2,0,
			iwidth, iwidth);
console.log((divwidth - iwidth) / 2, (divheight - iwidth) / 2);
	};

	init_canvas();
});
