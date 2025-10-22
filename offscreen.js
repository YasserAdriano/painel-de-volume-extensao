/**
 * @file offscreen.js
 * O "engenheiro de som". Roda no documento offscreen.
 * Recebe o stream de áudio, cria o AudioContext, aplica o GainNode
 * e gerencia o volume em tempo real.
 */

const activeStreams = new Map();

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'START_OFFSCREEN_AUDIO') {
    // Se já existe um, para o antigo
    if (activeStreams.has(message.tabId)) {
      stopAudio(message.tabId);
    }
    startAudio(message);
  } else if (message.type === 'UPDATE_OFFSCREEN_VOLUME') {
    updateVolume(message.tabId, message.newVolume);
  } else if (message.type === 'STOP_OFFSCREEN_AUDIO') {
    stopAudio(message.tabId);
  }
});

async function startAudio({ streamId, tabId, initialVolume }) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
    });
  } catch (e) {
    console.error("Falha ao pegar stream no offscreen:", e);
    return;
  }

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const gainNode = audioContext.createGain();

  gainNode.gain.value = initialVolume / 100;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  activeStreams.set(tabId, { audioContext, gainNode, stream });
}

function updateVolume(tabId, newVolume) {
  const audio = activeStreams.get(tabId);
  if (audio && audio.gainNode) {
    // Valida o volume
    let vol = parseInt(newVolume, 10);
    if (isNaN(vol)) vol = 100;
    if (vol < 0) vol = 0;
    if (vol > 500) vol = 500;
    
    audio.gainNode.gain.value = vol / 100;
  }
}

function stopAudio(tabId) {
  const audio = activeStreams.get(tabId);
  if (audio) {
    // Para as trilhas da stream (para o ícone de "gravando" sumir)
    audio.stream.getTracks().forEach(track => track.stop());
    // Fecha o contexto de áudio
    audio.audioContext.close();
    activeStreams.delete(tabId);
  }
}