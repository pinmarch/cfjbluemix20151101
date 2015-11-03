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
		window.showRadar();
	});

	$("#set_center").click(function(e) {
		e.preventDefault();
		window.showCurrentPosition(function (position) {
			window.gmap.panTo(
				{ lat: position.coords.latitude, lng: position.coords.longitude }
			);
		});
	});

	var radar_image_url = "images/radar-306289_640.png";
	var radar_image_obj = null;
	var radar_image_ready = false;
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
			radar_image_ready = true;
		};
		radar_image_obj.src = radar_image_url;
	}

	window.showRadar = function (data) {
		if (!ctx || !radar_image_ready) { return; }

		var canvas = $("#radar_canvas"),
		    divwidth = canvas.innerWidth(), divheight = canvas.innerHeight(),
		    canwidth = 300, canheight = 300,
		    iwidth = radar_image_obj.width, iheight = radar_image_obj.height,
		    fit_ratio_w = iwidth / divwidth,
		    fit_ratio_h = iheight / divheight,
		    fit_ratio = (fit_ratio_w > fit_ratio_h) ? fit_ratio_w : fit_ratio_h,
		    fin_width = iwidth / fit_ratio * canwidth / divwidth,
		    fin_height = iheight / fit_ratio * canheight / divheight;

		ctx.drawImage(radar_image_obj,
			(300 - fin_width) / 2, (300 - fin_height) / 2,
			fin_width, fin_height);
	};

	init_canvas();
});
