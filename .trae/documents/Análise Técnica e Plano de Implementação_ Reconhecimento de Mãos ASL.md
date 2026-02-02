# Relatório Técnico: Reconhecimento de Sinais ASL com TensorFlow\.js

## 1. Visão Geral e Arquitetura

A solução analisada é uma aplicação web baseada em **React (Next.js)** que realiza reconhecimento de gestos em tempo real diretamente no navegador (Client-side). A arquitetura dispensa backend para processamento de imagem, garantindo privacidade e baixa latência de rede.

### Diagrama de Fluxo de Dados

```mermaid
graph TD
    A[Webcam] -->|Stream de Vídeo| B(TensorFlow.js Backend WebGL)
    B -->|Frame| C[Modelo MediaPipe Handpose]
    C -->|Extração| D{21 Landmarks 3D}
    D -->|Coordenadas x,y,z| E[Visualização Canvas]
    D -->|Coordenadas x,y,z| F[Biblioteca Fingerpose]
    F -->|Comparação Vetorial| G[Banco de Definições de Gestos]
    G -->|Match com maior confiança| H[Predição do Sinal (Ex: 'A')]
    H -->|Estado React| I[Interface do Usuário]
```

## 2. Componentes Principais e Análise de Código

### A. Detecção de Mãos (Model Layer)

* **Biblioteca**: `@tensorflow-models/handpose` (v0.0.6).

* **Modelo**: Utiliza o modelo Handpose do MediaPipe portado para TF.js.

* **Saída**: Retorna um array de objetos contendo as coordenadas 3D de 21 pontos da mão (punho + 4 articulações por dedo).

* **Código**: Localizado em `pages/index.js`, inicializado via `handpose.load()` e executado via `net.estimateHands(video)`.

### B. Classificação de Gestos (Logic Layer)

* **Abordagem**: Não utiliza Rede Neural para classificação final (ex: CNN), mas sim um **algoritmo heurístico/baseado em regras** através da biblioteca `fingerpose`.

* **Funcionamento**:

  1. Calcula a curvatura (`NoCurl`, `HalfCurl`, `FullCurl`) e direção (`VerticalUp`, `DiagonalUpRight`, etc.) de cada dedo.
  2. Compara com definições pré-estabelecidas.

* **Definições**: Os "arquivos de treinamento" são na verdade scripts JS em `components/handsigns/` (ex: `Asign.js`).

  * *Exemplo (Sinal A)*: Dedos indicador, médio, anelar e mínimo com `FullCurl`; Polegar com `NoCurl` e direção `Up`.

### C. Pipeline de Processamento

1. **Captura**: `react-webcam` gerencia o feed de vídeo.
2. **Loop de Inferência**: Um `setInterval` de **150ms** (aprox. 6.6 FPS) dispara a detecção.

   * *Nota*: O uso de `setInterval` é menos performático que `requestAnimationFrame`.
3. **Visualização**: `components/handposeutil.js` desenha o esqueleto da mão (linhas entre articulações) em um elemento `<canvas>` sobreposto ao vídeo.

## 3. Dependências Chave

* **Core**: `react`, `next`.

* **ML/Visão**: `@tensorflow/tfjs`, `@tensorflow-models/handpose`, `fingerpose`.

* **UI**: `@chakra-ui/react`, `react-icons`.

## 4. Métricas e Limitações

* **Performance**: O tempo de inferência do Handpose pode variar de 20ms a 100ms+ dependendo da GPU do dispositivo. A aplicação limita artificialmente a 6 FPS.

* **Acurácia**: Alta para detecção da mão, mas a classificação via `fingerpose` é sensível ao ângulo da câmera. Gestos dinâmicos (que envolvem movimento, como 'J' ou 'Z') são difíceis de capturar apenas com análise estática de frame.

***

# Plano de Implementação Web

Este plano visa integrar a funcionalidade de reconhecimento de ASL em um website existente ou novo.

## Fase 1: Configuração e Dependências

1. **Instalação de Pacotes**:

   * Instalar `@tensorflow/tfjs`, `@tensorflow-models/handpose`, e `fingerpose`.

   * Garantir que o bundler (Webpack/Vite) suporte carregamento de binários do TF.js (geralmente automático).
2. **HTTPS**: Configurar ambiente local e produção para HTTPS (obrigatório para acesso à webcam).

## Fase 2: Migração da Lógica de Reconhecimento

1. **Portar Definições de Gestos**:

   * Copiar a pasta `components/handsigns` para o novo projeto.

   * Criar um índice centralizado para importar todos os gestos (A-Z).
2. **Utility de Desenho**:

   * Adaptar `components/handposeutil.js` para desenhar o esqueleto da mão no Canvas.

## Fase 3: Desenvolvimento do Componente React

1. **Hook de Webcam**:

   * Implementar um hook `useHandPose` que gerencia:

     * Carregamento do modelo (com estado de `loading`).

     * Permissão de câmera.

     * Loop de detecção (`requestAnimationFrame` recomendado ao invés de `setInterval`).
2. **Otimização de Performance**:

   * Utilizar `tf.tidy()` se houver operações tensoriais manuais (não necessário com `fingerpose` padrão, mas boa prática).

   * Implementar "frame skipping" se o dispositivo for lento (detectar FPS baixo e reduzir frequência de inferência).
3. **Tratamento de Erros**:

   * Fallback visual caso a webcam não seja detectada.

   * Mensagens claras se o modelo falhar ao carregar (problemas de rede/CDN).

## Fase 4: UX e Interface

1. **Feedback Visual**:

   * Mostrar um "esqueleto" sobre a mão para confirmar que o sistema está rastreando.

   * Exibir emoji ou letra correspondente com transição suave quando o gesto for reconhecido com confiança > 8.0.
2. **Feedback de Carregamento**:

   * O modelo Handpose é pesado (\~10MB+ descompactado). Exibir barra de progresso ou splash screen durante o download inicial.

## Recomendações de Melhoria (vs Repositório Original)

* **Loop de Renderização**: Substituir `setInterval(..., 150)` por `requestAnimationFrame` para movimentos mais fluidos, controlando o throttle da inferência separadamente da renderização do vídeo.

* **Carregamento Assíncrono**: Usar `React.lazy` ou imports dinâmicos para carregar as bibliotecas do TensorFlow apenas quando o usuário ativar a funcionalidade, economizando bundle size inicial.

