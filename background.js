/**
 * @file background.js
 * O "cérebro" da extensão. Gerencia a captura de áudio e a comunicação
 * com o documento offscreen (que processa o áudio).
 */

// --- Gerenciamento do Documento Offscreen ---
let creatingOffscreen; // Flag para evitar corridas
async function setupOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }
  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Processamento de áudio da aba (tabCapture)',
  });
  await creatingOffscreen;
  creatingOffscreen = null;
}

// --- Lógica de Captura (Ouvindo o popup) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CAPTURE') {
    startCapture(message.tabId);
    return true; // Indica resposta assíncrona
  }
  if (message.type === 'STOP_CAPTURE') {
    stopCapture(message.tabId);
    return true;
  }
});

async function startCapture(tabId) {
  await setupOffscreenDocument();

  // Tenta obter o streamId
  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (e) {
    console.error("Falha ao capturar tab (talvez o usuário negou?):", e);
    return;
  }

  // Muta a aba original
  await chrome.tabs.update(tabId, { muted: true });

  // Pega o volume salvo
  const tabKey = String(tabId);
  const data = await chrome.storage.session.get([tabKey]);
  const initialVolume = data[tabKey] !== undefined ? data[tabKey] : 100;

  // Envia o stream para o offscreen
  chrome.runtime.sendMessage({
    type: 'START_OFFSCREEN_AUDIO',
    streamId: streamId,
    tabId: tabId,
    initialVolume: initialVolume
  });
}

async function stopCapture(tabId) {
  // Tira o mute da aba
  try {
    await chrome.tabs.update(tabId, { muted: false });
  } catch (e) { /* Tab pode não existir mais, tudo bem */ }

  // Envia mensagem para o offscreen parar o áudio
  chrome.runtime.sendMessage({
    type: 'STOP_OFFSCREEN_AUDIO',
    tabId: tabId
  });
}

// --- Sincronização de Volume ---
// Ouve mudanças no storage (feitas pelo popup) e repassa para o offscreen
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'session') {
    for (let [tabKey, { newValue }] of Object.entries(changes)) {
      // Ignora as flags de captura, só queremos números de volume
      if (!isNaN(parseInt(tabKey, 10))) {
        chrome.runtime.sendMessage({
          type: 'UPDATE_OFFSCREEN_VOLUME',
          tabId: parseInt(tabKey, 10),
          newVolume: newValue
        });
      }
    }
  }
});

// --- Limpeza Automática ---
// Se uma aba for fechada, para a captura
chrome.tabs.onRemoved.addListener((tabId) => {
  stopCapture(tabId);
});