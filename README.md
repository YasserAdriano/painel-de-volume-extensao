# Super Volume - Painel de Controle

Um painel de controle de volume avançado para navegadores baseados em Chromium (Google Chrome, Opera, Brave, etc.), permitindo o gerenciamento de volume por aba.

Projeto idealizado e dirigido por **Yasser Adriano**.

## Visão Geral

Esta extensão substitui o controle de volume padrão por um painel completo, acessível pelo ícone na barra de ferramentas. O painel lista todas as abas abertas e permite ajustar o volume de cada uma individualmente, de 0% a 500%.

## Funcionalidades

* **Controle por Aba:** Ajuste o volume de qualquer aba (YouTube, Twitch, Meet, etc.) sem precisar navegar até ela.
* **Limite Estendido:** Aumente o volume em até 500% ou diminua para 0% (mudo).
* **UI Sincronizada:** Controles duplos (slider e caixa de número) que se atualizam em tempo real.
* **Gerenciamento de Estado:** A extensão salva o volume de cada aba. Ao voltar para uma aba, o volume definido por você é mantido.
* **Painel Dinâmico:** A lista de abas é gerada dinamicamente, mostrando o ícone (favicon) e o título de cada página.

## Tecnologias Utilizadas

* **JavaScript (ES6+):** Lógica principal da extensão.
* **HTML5 & CSS3:** Estrutura e estilo do popup.
* **Chrome Extension API (Manifest V3):**
    * `chrome.scripting`: Para injetar o código de áudio nas abas.
    * `chrome.storage.session`: Para salvar o volume de cada aba.
    * `chrome.tabs`: Para listar todas as abas abertas no painel.
* **Web Audio API:**
    * `AudioContext` e `GainNode` para manipular o ganho de áudio de elementos `<video>` e `<audio>` além do limite de 100%.

## Como Instalar Localmente

1.  Baixe ou clone este repositório.
2.  Abra o seu navegador (Chrome, Opera, etc.) e navegue até a página de extensões (`chrome://extensions` ou `opera://extensions`).
3.  Ative o "Modo de desenvolvedor" (geralmente no canto superior direito).
4.  Clique em "Carregar sem compactação" (ou "Load unpacked").
5.  Selecione a pasta onde você salvou os arquivos do projeto.