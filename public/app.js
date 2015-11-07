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
		window.showRadar(null);
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
	var canvas2 = $('<canvas></canvas>');
	var ctxbg = null;
	var canvas_alpha = 0;
	var radar_positions = {};
	var radar_center = null;
	var radar_mindistance = -1;

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

		window.compass_rotate = 0;
		window.addEventListener('deviceorientation', function(event) {
			var alpha = event.alpha; // it's needed
			// var beta = event.beta;
			// var gamma = event.gamma;

			window.compass_rotate = alpha;
		});

		window.showCurrentPosition(function(position) {
			radar_center = { lat: position.coords.latitude, lng: position.coords.longitude };
		});
 	}

	function calc_pointrelation(latlng1, latlng2) {
		var r = 6378137; // radius of the earth (m)
		var lat1 = latlng1.lat * Math.PI / 180,
		    lng1 = latlng1.lng * Math.PI / 180,
		    lat2 = latlng2.lat * Math.PI / 180,
		    lng2 = latlng2.lng * Math.PI / 180;
		var d = r * Math.acos(
			Math.sin(lat1) * Math.sin(lat2) +
			Math.cos(lat1) * Math.cos(lat2) *
			Math.cos(lng2 - lng1));
		var phi = 90 - Math.atan2(
			Math.cos(lat1) * Math.tan(lat2) -
			Math.sin(lat1) * Math.cos(lng2 - lng1),
			Math.sin(lng2 - lng1));
		return { "d": d, "phi": phi };
	}

	function calc_distancesforplot(data) {
		var mindist = Number.MAX_VALUE;
		Object.keys(data).forEach(function(v) {
			var rel = calc_pointrelation(radar_center, data[v]);
			if (mindist > rel.d) { mindist = rel.d; }
			data[v].distance = rel.d;
			data[v].theta = rel.phi;
			// console.log(rel);
		});

		radar_mindistance = mindist;
	}

	function calc_plotpoint(data, imagerad) {
		var mindist = radar_mindistance < 30 ? 30 : (radar_mindistance * 1.2);

		Object.keys(data).forEach(function(v) {
			data[v].r = imagerad * data[v].distance / mindist;
		});
	}

	function plot_onradar(ctx, spot, alpha) {
		ctx.globalAlpha = alpha;
		ctx.beginPath();
		ctx.arc(Math.sin(-spot.theta * Math.PI / 180) * spot.r,
		        Math.cos(-spot.theta * Math.PI / 180) * spot.r,
		        4, 0, 2 * Math.PI);
		ctx.fillStyle = "#f00";
		ctx.fill();
		ctx.globalAlpha = 1.0;
		// console.log(spot.r, spot.theta);
	}

	window.showRadar = function (data) {
		if (!ctx || !radar_image_ready) { return; }
		if (data) {
			data.lng = data.Long;
			data.lat = data.Lat;
			radar_positions[data.DeviceId] = data;
		}

		var canvas = $("#radar_canvas"),
		    divwidth = canvas.innerWidth(), divheight = canvas.innerHeight(),
		    canwidth = 300, canheight = 300,
		    iwidth = radar_image_obj.width, iheight = radar_image_obj.height,
		    fit_ratio_w = (divwidth * 0.8) / iwidth,
		    fit_ratio_h = (divheight * 0.8) / iheight,
		    fit_ratio = (fit_ratio_w < fit_ratio_h) ? fit_ratio_w : fit_ratio_h,
		    fin_width = iwidth * fit_ratio,
		    fin_height = iheight * fit_ratio;
		// console.log(fit_ratio, fin_width, fin_height);

		var me = this;
		this.drawfunc = function() {
			canvas2.attr('width', divwidth);
			canvas2.attr('height', divheight);
			ctxbg = canvas2.get(0).getContext('2d');
			ctxbg.fillRect(0, 0, divwidth, divheight);
			ctxbg.drawImage(radar_image_obj,
				(divwidth - fin_width) / 2, (divheight - fin_height) / 2,
				fin_width, fin_height);
			ctxbg.translate(divwidth / 2, divheight / 2);
			ctxbg.rotate(window.compass_rotate + Math.PI);
			// console.log(radar_positions);
			if (radar_positions) {
				calc_plotpoint(radar_positions, fin_width / 2);
				Object.keys(radar_positions).forEach(function(v) {
					plot_onradar(ctxbg, radar_positions[v], Math.sin(canvas_alpha / Math.PI * 180) * 0.3 + 0.7);
				});
			}
			canvas_alpha++;
			if (canvas_alpha == 360) { canvas_alpha = 0; }

			ctx.scale(canwidth / divwidth, canheight / divheight);
			ctx.drawImage(canvas2.get(0), 0, 0);
			ctx.setTransform(1, 0, 0, 1, 0, 0);

			setTimeout(me.drawfunc, 30);
		};

		if (ctxbg !== null) { return; }

		var refreshfunc = function() {
			if ($("#radar:visible").length > 0) {
				window.showCurrentPosition(function(position) {
					radar_center = { lat: position.coords.latitude, lng: position.coords.longitude };
					calc_distancesforplot(radar_positions);
					$("#radar .distance-text span").text(
						(Math.floor(radar_mindistance * 100) / 100) + "m");
				});
			}
			setTimeout(refreshfunc, 500);
		};

		refreshfunc();
		setTimeout(this.drawfunc, 30);
	};

	init_canvas();
});
