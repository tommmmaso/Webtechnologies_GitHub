const SPOTIFY_CLIENT_ID = "1d50e930a8b34a4998dc537704793eb2";
const SPOTIFY_CLIENT_SECRET = "b6fbf298ba2141f49f9859341ec742dc";
const PLAYLIST_ID = "4dgb10igv3UE484F8e9Trx";
const container = document.querySelector('div[data-js="tracks"]');
const currentTrackContainer = document.getElementById('current-track');
const rotatingElement = document.querySelector('.element'); // Select the element you want to rotate

function fetchPlaylist(token, playlistId) {
  console.log("token: ", token);

  fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);

      if (data.tracks && data.tracks.items) {
        data.tracks.items.forEach((item) => {
          console.log(item.track.name);
        });

        addTracksToPage(data.tracks.items);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function addTracksToPage(items) {
  const ul = document.createElement("ul");

  items.forEach((item) => {
    console.log("track: ", item.track);
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="track-item">
        ${
          item.track.preview_url
            ? `<button class="play-pause material-icons" aria-label="Play">play_arrow</button>
               <audio src="${item.track.preview_url}"></audio>`
            : '<span class="material-icons no-preview">close</span>'
        }
        <p><span class="track-name-pl">${item.track.name}</span> <br> <span class="artist-name-pl">${item.track.artists.map((artist) => artist.name).join(", ")}</span></p>
      </div>
    `;

    ul.appendChild(li);

    // Add event listener for the play/pause button
    if (item.track.preview_url) {
      const audio = li.querySelector('audio');
      const button = li.querySelector('.play-pause');

      button.addEventListener('click', () => {
        const currentlyPlayingAudio = document.querySelector('audio:not([paused])');
        
        // Pause any currently playing audio
        if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
          currentlyPlayingAudio.pause();
          const currentlyPlayingButton = document.querySelector('.play-pause.icon-pause');
          if (currentlyPlayingButton) {
            currentlyPlayingButton.classList.replace('icon-pause', 'icon-play');
            currentlyPlayingButton.textContent = 'play_arrow';
          }
        }
        
        if (audio.paused) {
          audio.play();
          button.classList.replace('icon-play', 'icon-pause');
          button.textContent = 'pause';
          updateCurrentTrack(item.track);
          rotatingElement.classList.add('rotating'); // Start rotating
          rotatingElement.classList.remove("rotating-pause") 
        } else {
          audio.pause();
          button.classList.replace('icon-pause', 'icon-play');
          button.textContent = 'play_arrow';
          rotatingElement.classList.add('rotating-pause'); // Stop rotating
        }
      });

      audio.addEventListener('ended', () => {
        button.classList.replace('icon-pause', 'icon-play');
        button.textContent = 'play_arrow';
        rotatingElement.classList.add('rotating-pause'); // Stop rotating when the audio ends
      });
    }
  });

  container.appendChild(ul);
}

function updateCurrentTrack(track) {
  currentTrackContainer.style.display = 'block';
  currentTrackContainer.innerHTML = `
    <p><span class="track-name">${track.name}</span> <br> <span class="artist-name">${track.artists.map((artist) => artist.name).join(", ")}</span></p>
  `;
}

function fetchAccessToken() {
  fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=${SPOTIFY_CLIENT_SECRET}`,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.access_token) {
        fetchPlaylist(data.access_token, PLAYLIST_ID);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

fetchAccessToken();
