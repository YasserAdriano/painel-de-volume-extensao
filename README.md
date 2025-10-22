# Super Volume - Painel de Controle (v4.0)

Um painel de controle de áudio avançado para navegadores baseados em Chromium (Google Chrome, Opera, etc.), permitindo o gerenciamento de volume por aba via captura de áudio.

Projeto idealizado e dirigido por **Yasser Adriano**.

## Visão Geral

Esta extensão é um painel de controle de áudio completo. Ela utiliza a API de Captura de Aba (`tabCapture`) para interceptar e reprocessar o áudio de qualquer aba.

Isso permite o controle de volume em sites complexos (como **Google Meet** e **Microsoft Teams**) que outras extensões mais simples, baseadas em injeção de script, não conseguem afetar. O painel lista todas as abas e permite ajustar o volume individualmente de 0% a 500%.

## Funcionalidades

* **Compatibilidade Universal (via tabCapture):** Funciona em todos os sites, incluindo aplicações complexas de WebRTC (Google Meet, Teams, etc.).
* **Controle por Aba:** Ajuste o volume de qualquer aba sem precisar navegar até ela.
* **Limite Estendido:** Aumente o volume em até 500% ou diminua para 0% (mudo).
* **UI Sincronizada:** Controles duplos (slider e caixa de número) que se atualizam em tempo real.
* **Gerenciamento de Estado:** A extensão salva o volume de cada aba que está sendo controlada.

## Tecnologias Utilizadas

* **JavaScript (ES6+):** Lógica principal da extensão.
* **HTML5 & CSS3:** Estrutura e estilo do popup.
* **Chrome Extension API (Manifest V3):**
    * `Service Worker (background.js)`: Gerencia o estado da extensão, a captura de áudio e os eventos.
    * `chrome.tabCapture`: Para capturar o stream de áudio da aba.
    * `chrome.offscreen`: Para criar um documento de áudio que processa o som em segundo plano sem ser encerrado.
    * `chrome.storage.session`: Para salvar o volume de cada aba.
    * `chrome.tabs`: Para listar todas as abas abertas no painel.
* **Web Audio API:**
    * `AudioContext` e `GainNode`: Para aplicar o ganho (volume) ao stream de áudio capturado em tempo real.

## Como Instalar Localmente

1.  Baixe ou clone este repositório.
2.  Abra o seu navegador (Chrome, Opera, etc.) e navegue até a página de extensões (`chrome://extensions` ou `opera://extensions`).
3.  Ative o "Modo de desenvolvedor" (geralmente no canto superior direito).
4.  Clique em "Carregar sem compactação" (ou "Load unpacked").
5.  Selecione a pasta onde você salvou os arquivos do projeto.
6.  Após carregar, vá para a aba que deseja controlar (ex: Google Meet).
7.  Clique no ícone da extensão para abrir o painel.
8.  Encontre a aba na lista e clique no botão **"Ativar Controle de Volume"**.
9.  O navegador pedirá permissão para "Compartilhar esta aba". **Selecione a aba e clique em "Compartilhar"**.
10. Pronto! A extensão irá mutar a aba original e começar a tocar o áudio processado. Agora você pode usar o slider.

## ⚠️ Aviso sobre a Instalação

Ao carregar a extensão, é muito provável que o seu navegador (especialmente o Opera) mostre um botão **"Erros"** e reporte um aviso sobre a chave **`"offscreen"`** no manifesto.

**Isso é um bug conhecido do navegador e pode ser ignorado.** A extensão foi testada e é **totalmente funcional**, mesmo com este aviso "falso-positivo" aparecendo.
