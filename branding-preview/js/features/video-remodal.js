/* Controls HTML video playback in Remodal video dialogs. */

// video in remodal
$(document).ready(() => {
  $('[data-remodal-id^="video"]').each(function() {
    const $modal = $(this);
    const $video = $modal.find('video');
    if (!$video.length) return;
    const shouldLoop = $modal.is('[data-video-loop]');
    const player = new Plyr($video, {
      controls: ['progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      volume: 0.5,
      media: shouldLoop ? { loop: true } : {},
      fullscreen: { enabled: true, fallback: true, iosNative: true, container: null }
    });
    player.on('pause', () => $modal.find('[data-video-play]').show());
    player.on('play', () => $modal.find('[data-video-play]').hide());
    $modal.on('opened', () => player.play());
    $modal.on('closing', () => player.pause());
  });
});
