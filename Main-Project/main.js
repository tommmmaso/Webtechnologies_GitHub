const SPOTIFY_CLIENT_ID = "1d50e930a8b34a4998dc537704793eb2";
const SPOTIFY_CLIENT_SECRET = "b6fbf298ba2141f49f9859341ec742dc";
const PLAYLIST_ID = "4dgb10igv3UE484F8e9Trx";
const container = document.querySelector('div[data-js="tracks"]');
const currentTrackContainer = document.getElementById('current-track');
const rotatingElement = document.querySelector('.element'); // Select the element you want to rotate
const turnOn = document.querySelector(".rectangle");

let audioContext;
let currentSource;
let currentPlayingItem; // Track currently playing
let isReversePlaying = false; // Flag to track reverse playback state

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

    const trackItemHTML = `
      <div class="track-item">
        <div class="track-item-base">
          ${item.track.preview_url ? `<button class="play-pause material-icons" aria-label="Play">play_arrow</button>
          <audio src="${item.track.preview_url}"></audio>` : '<span class="material-icons no-preview">close</span>'}
          <p><span class="track-name-pl">${item.track.name}</span> <br> <span class="artist-name-pl">${item.track.artists.map((artist) => artist.name).join(", ")}</span></p>
        </div>
        ${item.track.preview_url ? '<button class="play-reverse material-icons" aria-label="Play Reverse">play_arrow</button>' : '<span class="material-icons no-preview">close</span>'}
      </div>
    `;

    li.innerHTML = trackItemHTML;
    ul.appendChild(li);

    if (item.track.preview_url) {
      const audio = li.querySelector('audio');
      const playButton = li.querySelector('.play-pause');
      const reverseButton = li.querySelector('.play-reverse');

      playButton.addEventListener('click', () => togglePlayback(audio, playButton, reverseButton, item.track));
      if (reverseButton) {
        reverseButton.addEventListener('click', () => togglePlayback(audio, reverseButton, playButton, item.track));
      }

      audio.addEventListener('ended', () => {
        playButton.classList.replace('icon-pause', 'icon-play');
        playButton.textContent = 'play_arrow';
        rotatingElement.classList.add('rotating-pause'); // Stop rotating when the audio ends
      });
    }
  });

  container.appendChild(ul);
}

function togglePlayback(audio, buttonToToggle, otherButton, track) {
  const isPlaying = !audio.paused;

  if (isPlaying && currentSource && currentSource.isPlaying) {
    currentSource.source.stop();
    currentSource.source.disconnect();
    currentSource.isPlaying = false;
    buttonToToggle.classList.replace('icon-pause', 'icon-play');
    buttonToToggle.textContent = 'play_arrow';
    rotatingElement.classList.add('rotating-pause'); // Stop rotating 
    return;
  }

  if (buttonToToggle.classList.contains('play-reverse')) {
    if (isReversePlaying) {
      // Pause reverse playback
      currentSource.source.stop();
      currentSource.source.disconnect();
      currentSource.isPlaying = false;
      buttonToToggle.classList.replace('icon-pause', 'icon-play');
      buttonToToggle.textContent = 'play_arrow';
      rotatingElement.classList.add('rotating-pause'); // Stop rotating
      isReversePlaying = false;
    } else {
      // Start reverse playback
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      reverseAndPlayAudio(audio.src).then(source => {
        currentSource = { source, isPlaying: true };
        updateCurrentTrack(track); // Update current track info when starting reverse playback
      });

      buttonToToggle.classList.replace('icon-play', 'icon-pause');
      buttonToToggle.textContent = 'pause';
      rotatingElement.classList.add('rotatingBack'); // Start rotating
      rotatingElement.classList.remove("rotating-pause");
      rotatingElement.classList.remove("rotating");
      turnOn.classList.add("colorOn", "borderColorOn", "transition");
      turnOn.classList.remove("colorOff", "borderColorOff");

      isReversePlaying = true;
    }
  } else {
    if (isReversePlaying) {
      // Stop reverse playback if it's playing
      currentSource.source.stop();
      currentSource.source.disconnect();
      currentSource.isPlaying = false;
      isReversePlaying = false;
      rotatingElement.classList.remove('rotatingBack');
      rotatingElement.classList.add('rotating');
      rotatingElement.classList.remove('rotating-pause');
    }

    if (isPlaying) {
      audio.pause();
      buttonToToggle.classList.replace('icon-pause', 'icon-play');
      buttonToToggle.textContent = 'play_arrow';
      rotatingElement.classList.add('rotating-pause'); // Stop rotating 
    } else {
      audio.play();
      buttonToToggle.classList.replace('icon-play', 'icon-pause');
      buttonToToggle.textContent = 'pause';
      rotatingElement.classList.add('rotating'); // Start rotating
      rotatingElement.classList.remove('rotatingBack');
      rotatingElement.classList.remove("rotating-pause");
      turnOn.classList.add("colorOn", "borderColorOn", "transition");
      turnOn.classList.remove("colorOff", "borderColorOff");
      updateCurrentTrack(track); // Update current track info when starting normal playback
    }
  }

  if (otherButton !== buttonToToggle && otherButton) {
    otherButton.classList.replace('icon-pause', 'icon-play');
    otherButton.textContent = 'play_arrow';
  }
}

function updateCurrentTrack(track) {
  currentPlayingItem = track; // Store current playing track
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

async function reverseAndPlayAudio(audioUrl) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const source = audioContext.createBufferSource();
  const reversedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    const channelData = audioBuffer.getChannelData(i);
    reversedBuffer.copyToChannel(channelData.slice().reverse(), i);
  }

  source.buffer = reversedBuffer;
  source.connect(audioContext.destination);

  source.start();

  return source;
}

fetchAccessToken();