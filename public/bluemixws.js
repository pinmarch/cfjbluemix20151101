;
$(function () {

    var wsUrl = "wss://youkidearitai.eu-gb.mybluemix.net/ws/map";
    // ws://code4jp2015.mybluemix.net/ws/map
    var webSocket = null;
    var hotspots = {};

    function connect() {
        if (webSocket == null) {
            // WebSocket の初期化
            webSocket = new WebSocket(wsUrl);
            // イベントハンドラの設定
            webSocket.onmessage = onMessage;
            webSocket.onclose = onClose;
            webSocket.onerror = onError;
        }
    }

    function onMessage(event) {
        //console.log(event);
        var sensorData = JSON.parse(event.data);
        //console.log(sensorData);
        // {"Timestamp":"2015-07-24 04:46:22","temperature1":32.8,"temperature2":66.2,"Lux":437}
        $(jQuery.makeArray(sensorData)).each(function(i, data) {
            registerData(data);
            if ($("#map:visible").length > 0) {
                window.showCircles(data);
            } else {
                window.showRadar(data);
            }
        });
    }

    function onError(event) {
        console.log(event);
    }

    function onClose(event) {
        console.log(event.code);
        webSocket = null;    // 勝手に接続が切れることがあるので、自動再接続する
        connect();
    }

    function initialize_map() {
        var mapOptions = {
            zoom: 16,
            center: { lat: 35.732392, lng: 139.715496},
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        window.gmap = new google.maps.Map($('#map').get(0), mapOptions);
        window.gmap_currentpos = undefined;

        // set current position
        window.showCurrentPosition();
    }

    function registerData(data) {
        var t = (new Date()).getTime();
        if (hotspots[data.deviceId]) {
            hotspots[data.deviceId].latest = t;
            return;
        }

        var md = {
            position: { lat: data.Lat, lng: data.Long },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: '#f00',
                fillOpacity: 0.9,
                strokeWeight: 0
            },
            map: null
        };
        var m = new google.maps.Marker(md);
        var m2 = new google.maps.Marker(md);
        hotspots[data.deviceId] =
            { deviceObj: data, marker: m, markerbg: m2, latest: t };

        // 9秒後に地図から消すかの判断をするようタイマーをセット
        setTimeout(function() { clearData(data); }, 9000);
    }

    // 5秒以内にデバイスのデータが届いていなければ地図から消す
    function clearData(data) {
        var t = (new Date()).getTime();
        if (t - hotspots[data.deviceId].latest < 5000) {
            // 9秒後に地図から消すかの判断をするようタイマーをセット
            setTimeout(function() { clearData(data); }, 9000);
            return;
        }

        hotspots[data.deviceId].marker.setMap(null);
        hotspots[data.deviceId].markerbg.setMap(null);
        delete hotspots[data.deviceId];
    }

    window.showCurrentPosition = function (nextfn) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    var map = window.gmap;
                    var marker = window.gmap_currentpos;
                    if (!window.gmap_currentpos) {
                        marker = new google.maps.Marker({
                            position: { lat: position.coords.latitude, lng: position.coords.longitude },
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 4
                            }
                        });
                        window.gmap_currentpos = marker;
                    } else {
                        marker.setPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
                    }
                    $(".title a:first").text(position.coords.latitude+","+position.coords.longitude);
                    console.log(position.coords);
                    if (nextfn) { nextfn(position); }
                }, 
                function (error) {
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            console.error("User denied the request for Geolocation.");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            console.error("Location information is unavailable.");
                            break;
                        case error.TIMEOUT:
                            console.error("The request to get user location timed out.");
                            break;
                        case error.UNKNOWN_ERROR:
                            console.error("An unknown error occurred.");
                            break;
                    }
                });
        } else { 
            console.error("Geolocation is not supported by this browser.");
        }
    };

    window.showCircles = function (data) {
        var m = hotspots[data.deviceId].marker;
        var m2 = hotspots[data.deviceId].markerbg;
        m.setMap(window.gmap);
        m2.setMap(window.gmap);

        var drawCircle = function(mm, i) {
            mm.icon.fillOpacity = (50 - i) / 100.0 + 0.08;
            mm.icon.scale = i * 2.5;
            i++;
            if (i == 50) { i = 0; }
            if (hotspots[data.deviceId]) {
                mm.setMap(window.gmap);
                setTimeout(function() { drawCircle(mm, i); }, 20);
            }
        };
        drawCircle(m2, 0);
    };

    initialize_map();
    connect();
});
