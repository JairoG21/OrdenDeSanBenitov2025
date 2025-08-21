const apiKey = "AIzaSyAzGGB91bIkCd6yzVXnOUT4xdDoW9Qq7DE";
const channelId = "UCfB1ZvTmKh9LaZ8PGymXaaQ";
const maxResults = 9;
const videoGrid = document.getElementById("video-grid");

fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}`)
  .then(res => res.json())
  .then(data => {
    data.items.forEach(item => {
      if (item.id.kind === "youtube#video" && item.id.videoId) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube.com/embed/${item.id.videoId}`;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
      const col = document.createElement("div");
col.className = "col-md-4 mb-4"; // 3 columns per row on desktop
col.appendChild(iframe);
videoGrid.appendChild(col);
      }
    });
  })
  .catch(err => console.error("YouTube API Error:", err));
