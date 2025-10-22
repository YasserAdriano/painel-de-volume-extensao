/**
 * @file popup.js (v4.0 - "Capture-Only" Architecture)
 * Lógica do popup que constrói a UI e envia mensagens para o background.
 */

const DEFAULT_VOLUME = 100;

/**
 * Cria a UI para uma única aba.
 * A UI muda dependendo se a captura de áudio está ativa ou não.
 */
function createTabControlUI(tab, savedVolume, isCaptured) {
  const tabId = tab.id;
  const tabTitle = tab.title || "Aba sem título";
  const tabIcon = tab.favIconUrl || 'icon.png';

  const itemContainer = document.createElement('div');
  itemContainer.className = 'tab-control-item';

  // Info (Ícone e Título)
  const infoDiv = document.createElement('div');
  infoDiv.className = 'tab-info';
  const iconImg = document.createElement('img');
  iconImg.src = tabIcon;
  const titleLabel = document.createElement('span');
  titleLabel.className = 'tab-title';
  titleLabel.textContent = tabTitle;
  titleLabel.title = tabTitle;
  infoDiv.appendChild(iconImg);
  infoDiv.appendChild(titleLabel);
  itemContainer.appendChild(infoDiv);

  // Controles de Volume (Slider/Input)
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
  controlsDiv.appendChild(slider);
  controlsDiv.appendChild(input);
  controlsDiv.appendChild(percentLabel);
  itemContainer.appendChild(controlsDiv);

  // Botão de Ativação/Desativação
  const activateButton = document.createElement('button');
  activateButton.className = 'activate-button';
  itemContainer.appendChild(document.createElement('br')); // Espaçamento
  itemContainer.appendChild(activateButton);

  // Define o estado inicial da UI
  if (isCaptured) {
    activateButton.textContent = 'Desativar Controle';
    activateButton.classList.add('deactivate');
    controlsDiv.classList.remove('controls-hidden');
  } else {
    activateButton.textContent = 'Ativar Controle de Volume';
    activateButton.classList.remove('deactivate');
    controlsDiv.classList.add('controls-hidden');
  }

  // --- Listeners de Evento ---

  // Listener do Botão de Ativação
  activateButton.addEventListener('click', () => {
    const tabKey = String(tabId);
    const captureKey = `capture_${tabId}`;
    
    if (activateButton.classList.contains('deactivate')) {
      // --- DESATIVAR ---
      chrome.runtime.sendMessage({ type: 'STOP_CAPTURE', tabId: tabId });
      chrome.storage.session.remove([captureKey, tabKey]); // Limpa estado e volume
      activateButton.textContent = 'Ativar Controle de Volume';
      activateButton.classList.remove('deactivate');
      controlsDiv.classList.add('controls-hidden');
      slider.value = DEFAULT_VOLUME;
      input.value = DEFAULT_VOLUME;
    } else {
      // --- ATIVAR ---
      chrome.runtime.sendMessage({ type: 'START_CAPTURE', tabId: tabId });
      chrome.storage.session.set({ [captureKey]: true, [tabKey]: parseInt(slider.value, 10) });
      activateButton.textContent = 'Desativar Controle';
      activateButton.classList.add('deactivate');
      controlsDiv.classList.remove('controls-hidden');
    }
  });

  // Listeners de Volume (só salvam no storage)
  const saveVolume = (newVolume) => {
    // Só salva se a captura estiver ativa
    if (activateButton.classList.contains('deactivate')) {
      chrome.storage.session.set({ [String(tabId)]: parseInt(newVolume, 10) });
    }
  };

  slider.addEventListener('input', () => {
    input.value = slider.value;
    saveVolume(slider.value);
  });
  input.addEventListener('input', () => {
    slider.value = input.value;
    saveVolume(input.value);
  });
  input.addEventListener('blur', () => {
    let vol = parseInt(input.value, 10);
    if (isNaN(vol)) vol = DEFAULT_VOLUME;
    if (vol < 0) vol = 0;
    if (vol > 500) vol = 500;
    input.value = vol;
    slider.value = vol;
    saveVolume(vol);
  });

  return itemContainer;
}

/**
 * Ponto de entrada principal.
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tabListContainer');
  if (!container) return;

  chrome.tabs.query({}, (tabs) => {
    chrome.storage.session.get(null, (allData) => {
      for (const tab of tabs) {
        // Ignora abas que não podemos controlar
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
          continue;
        }
        
        const tabKey = String(tab.id);
        const captureKey = `capture_${tab.id}`;
        
        const savedVolume = allData[tabKey] !== undefined ? allData[tabKey] : DEFAULT_VOLUME;
        const isCaptured = allData[captureKey] === true;

        const tabUI = createTabControlUI(tab, savedVolume, isCaptured);
        container.appendChild(tabUI);
      }
    });
  });
});
