var API_KEY = 'AIzaSyAZlrXNbL8Yn35qa1308ALK0xnsoT4KNew';
var CLIENT_ID = '251341762062-f61683399sc5afo8t18mhk0i38tjte19.apps.googleusercontent.com';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
var SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';
var URLREG = /(?:youtube\.com\/playlist)(?:.*?)(?:list=(.*?)(?:$|&))/;

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    console.log('Signin statue: ', isSignedIn);
    // loadYTPlaylist('PLi_Yfo8cLd49Z3J2qdNJG5eyV8o6WEI6y');
}

document.addEventListener("DOMContentLoaded", function () {
    gapi.load('client:auth2', initClient);
});

var playlist = [];
var current_song = 0;
var player;
var player_state = 0;

function loadYTPlaylist(playlistId, pageToken) {
    // $('#video-container').html('');
    var requestOptions = {
        playlistId: playlistId,
        part: 'snippet',
        maxResults: 50
    };
    if (pageToken) {
        requestOptions.pageToken = pageToken;
    }
    var request = gapi.client.youtube.playlistItems.list(requestOptions);
    request.execute(function (response) {
        var playlistItems = response.result.items;
        // console.log(playlistItems);

        if (playlistItems) {
            playlistItems.forEach(function (item) {
                displayResult(item.snippet);
                playlist.push({
                    'id': item.snippet.resourceId.videoId,
                    'title': item.snippet.title,
                    'thumbnail': item.snippet.thumbnails
                });
            });
            if (response.result.nextPageToken) {
                loadYTPlaylist(playlistId, response.result.nextPageToken);
            } else {
                current_song = 0;
                playlist = shuffle(playlist);
                load_song(playlist[current_song]);
            }
        } else {
            console.log('Sorry you have no uploaded videos');
        }
    });
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function load_playlist() {
    var url = document.getElementById('playlisturl').value;
    var regout = URLREG.exec(url);
    if (regout instanceof Array && regout.length === 2) {
        playlist = [];
        loadYTPlaylist(regout[1])
    }
}

function displayResult(videoSnippet) {
    var title = videoSnippet.title;
    var videoId = videoSnippet.resourceId.videoId;
    console.log('Added Video: ' + title + ' - ' + videoId);
}

function load_song(song) {
    console.log('Loading song number: ', current_song);
    document.title = song.title;
    document.getElementById('title').innerHTML = song.title;
    document.getElementById('thumbnail').src = song.thumbnail.high.url;
    player.loadVideoById(song.id)
}


// create youtube player
function onYouTubePlayerAPIReady() {
    player = new YT.Player('yt', {
        width: '0',
        height: '0',
        // videoId: '0Bmhjf0rKe8',
        events: {
            // onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

// autoplay video
// function onPlayerReady(event) {
//     event.target.playVideo();
// }

// when video ends
function onPlayerStateChange(event) {
    player_state = event.data;
    var button = document.querySelector('#playpause i');
    button.classList.remove('fa-play');
    button.classList.remove('fa-pause');
    if (event.data === 1) {
        button.classList.add('fa-pause');
    } else {
        button.classList.add('fa-play');
    }
    if(event.data === 0) {
        next();
    }
}

function playpause() {
    if (player_state === 1) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function next() {
    if (++current_song >= playlist.length) {
        current_song = 0;
    }
    load_song(playlist[current_song]);
}

function previous() {
    if (--current_song < 0) {
        current_song = playlist.length - 1;
    }
    load_song(playlist[current_song]);
}