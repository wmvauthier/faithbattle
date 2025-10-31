function sortVideos(videos) {
  const now = new Date();
  return videos.sort((a, b) => getScore(b, now) - getScore(a, now));
}

function sortPosts(posts) {
  const now = new Date();
  return posts.sort((a, b) => getScore(b, now) - getScore(a, now));
}

function getScore(video, now) {
  const [day, month, year] = video.date.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  let recencyScore = 0;

  if (diffDays <= 90) {
    recencyScore = (90 - diffDays) * 10000;
  }

  const priorityScore = video.priority * 10000;
  return priorityScore + recencyScore;
}

function formatRelativeDate(dateStr) {
  const [day, month, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();

  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "hoje";
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 30) return `há ${diffDays} dias`;

  const diffMonths =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());

  if (diffMonths < 12) {
    return diffMonths === 1 ? "há 1 mês" : `há ${diffMonths} meses`;
  }

  const diffYears = now.getFullYear() - date.getFullYear();
  return diffYears === 1 ? "há 1 ano" : `há ${diffYears} anos`;
}

// Normaliza Instagram
function normalizeInstagram(p) {
  return {
    url: p.url,
    image: p.image,
    avatar: p.avatar || "img/default-avatar.png",
    user: p.user,
    date: p.date,
    rank: p.priority || 0,
    source: "instagram"
  };
}

// Normaliza YouTube
function normalizeYouTube(p) {
  return {
    url: p.url,
    image: p.thumb, // thumb vira imagem
    avatar: p.avatar || "img/default-avatar.png",
    user: p.channel, // canal vira user
    date: p.date,
    rank: p.priority || 0, // priority vira rank
    title: p.title,
    source: "youtube"
  };
}
