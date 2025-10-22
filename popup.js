/**
 * @file popup.js
 * Lógica principal do popup da extensão.
 * Constrói a UI com a lista de abas e gerencia a alteração de volume.
 */

const DEFAULT_VOLUME = 100;

/**
 * Função injetada na aba para manipular o áudio.
 * Utiliza a Web Audio API para aplicar ganho (volume).
 * Cria um nó de ganho se não existir um para o elemento de mídia.
 * @param {number} nivel - O nível de volume (ex: 100 para 100%, 500 para 500%).
 */
function aumentarVolume(nivel) {
  const mediaElement = document.querySelector('video') || document.querySelector('audio');
  if (!mediaElement) return;

  // Usa um Map global no 'window' para rastrear os AudioContexts por elemento
  if (!window.audioContextMap) window.audioContextMap = new Map();
  let gainNode;

  if (!window.audioContextMap.has(mediaElement)) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(mediaElement);
    gainNode = audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    window.audioContextMap.set(mediaElement, { audioContext, gainNode });
  } else {
    gainNode = window.audioContextMap.get(mediaElement).gainNode;
  }
  
  // Converte o volume percentual (ex: 150) para um valor de ganho (ex: 1.5)
  gainNode.gain.value = nivel / 100;
}

/**
 * Aplica o volume na aba especificada e salva o valor no storage da sessão.
 * @param {number|string} volume - O volume a ser aplicado (0-500).
 * @param {number} tabId - O ID da aba onde o script será injetado.
 * @returns {number} O valor do volume após validação e limpeza.
 */
function applyAndSaveVolume(volume, tabId) {
  // Validação e normalização do volume
  let vol = parseInt(volume, 10);
  if (isNaN(vol)) vol = DEFAULT_VOLUME;
  if (vol < 0) vol = 0;
  if (vol > 500) vol = 500;

  // Injeta a função 'aumentarVolume' na aba alvo
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: aumentarVolume,
    args: [vol]
  }).catch((error) => {
    // Silencia erros de injeção em abas protegidas (ex: chrome://, about:blank)
    console.warn(`Não foi possível injetar script na aba ${tabId}: ${error.message}`);
  });

  // Salva o volume usando o ID da aba como chave
  chrome.storage.session.set({ [String(tabId)]: vol });
  return vol; // Retorna o valor "limpo"
}

/**
 * Cria e retorna um nó do DOM para controlar o volume de uma aba.
 * @param {chrome.tabs.Tab} tab - O objeto da aba do Chrome.
 * @param {number} savedVolume - O volume salvo anteriormente para esta aba.
 * @returns {HTMLElement} O elemento 'div' contendo a UI de controle da aba.
 */
function createTabControlUI(tab, savedVolume) {
  const tabId = tab.id;
  const tabTitle = tab.title || "Aba sem título";
  const tabIcon = tab.favIconUrl || 'icon.png'; // Fallback para o ícone padrão

  // Criação dos elementos da UI
  const itemContainer = document.createElement('div');
  itemContainer.className = 'tab-control-item';

  const infoDiv = document.createElement('div');
  infoDiv.className = 'tab-info';
  
  const iconImg = document.createElement('img');
  iconImg.src = tabIcon;
  
  const titleLabel = document.createElement('span');
  titleLabel.className = 'tab-title';
  titleLabel.textContent = tabTitle; 
  titleLabel.title = tabTitle; // Tooltip para títulos longos

  infoDiv.appendChild(iconImg);
  infoDiv.appendChild(titleLabel);

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'control-wrapper';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = 500;
  slider.value = savedVolume;

  const input = document.createElement('input');
  input.type = 'number';
  input.min = 0;
  input.max = 500;
  input.value = savedVolume;
  
  const percentLabel = document.createElement('span');
  percentLabel.textContent = '%';

  // Montagem da UI
  controlsDiv.appendChild(slider);
  controlsDiv.appendChild(input);
  controlsDiv.appendChild(percentLabel);
  itemContainer.appendChild(infoDiv);
  itemContainer.appendChild(controlsDiv);

  // --- Sincronização dos Controles ---

  // Sincroniza input -> slider e aplica
  slider.addEventListener('input', () => {
    input.value = slider.value;
    applyAndSaveVolume(slider.value, tabId);
  });

  // Sincroniza slider -> input e aplica
  input.addEventListener('input', () => {
    slider.value = input.value;
    applyAndSaveVolume(input.value, tabId);
  });

  // Valida o valor ao perder o foco (blur)
  input.addEventListener('blur', () => {
    const cleanedVolume = applyAndSaveVolume(input.value, tabId);
    // Corrige a UI caso o valor digitado seja inválido (ex: 999)
    slider.value = cleanedVolume;
    input.value = cleanedVolume;
  });

  return itemContainer;
}

/**
 * Ponto de entrada principal. Executado quando o DOM do popup é carregado.
 * Busca todas as abas e volumes salvos, e constrói a lista na UI.
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tabListContainer');
  if (!container) return;

  // 1. Busca todas as abas de todas as janelas
  chrome.tabs.query({}, (tabs) => {
    
    // 2. Busca todos os volumes salvos no storage da sessão
    chrome.storage.session.get(null, (allVolumes) => {
      
      // 3. Itera sobre as abas e constrói a UI para cada uma
      for (const tab of tabs) {
        // Ignora abas internas do Chrome que não permitem injeção de script
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
          continue;
        }

        const tabKey = String(tab.id);
        const savedVolume = allVolumes[tabKey] !== undefined ? allVolumes[tabKey] : DEFAULT_VOLUME;
        
        // 4. Cria o elemento de controle da aba e o adiciona ao container
        const tabUI = createTabControlUI(tab, savedVolume);
        container.appendChild(tabUI);
      }
    });
  });
});