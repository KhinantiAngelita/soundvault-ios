// Format milidetik ke format mm:ss (contoh: 03:45)
export const formatTime = (millis) => {
  if (!millis || isNaN(millis) || millis < 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const padMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const padSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${padMinutes}:${padSeconds}`;
};

// Format ukuran file bytes ke KB atau MB
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
