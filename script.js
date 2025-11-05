document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const size = 4;
    let board = [];
    let currentScore = 0;
    const currentScoreElem = document.getElementById('current-score');

    let highScore = localStorage.getItem('2048-highScore') || 0;
    const highScoreElem = document.getElementById('high-score');
    highScoreElem.textContent = highScore;

    const gameOverElem = document.getElementById('game-over');

    function actualizarPuntaje(value) {
        currentScore += value;
        currentScoreElem.textContent = currentScore;
        if (currentScore > highScore) {
            highScore = currentScore;
            highScoreElem.textContent = highScore;
            localStorage.setItem('2048-highScore', highScore);
        }
    }

    function reiniciarJuego() {
        currentScore = 0;
        currentScoreElem.textContent = '0';
        gameOverElem.style.display = 'none';
        inicializarJuego();
    }

    function inicializarJuego() {
        board = [...Array(size)].map(e => Array(size).fill(0));
        colocarAleatorio();
        colocarAleatorio();
        renderizarTablero();
    }

    function renderizarTablero() {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                const prevValue = cell.dataset.value;
                const currentValue = board[i][j];
                if (currentValue !== 0) {
                    cell.dataset.value = currentValue;
                    cell.textContent = currentValue;
                    if (currentValue !== parseInt(prevValue) && !cell.classList.contains('new-tile')) {
                        cell.classList.add('merged-tile');
                    }
                } else {
                    cell.textContent = '';
                    delete cell.dataset.value;
                    cell.classList.remove('merged-tile', 'new-tile');
                }
            }
        }

        setTimeout(() => {
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.classList.remove('merged-tile', 'new-tile');
            });
        }, 300);
    }

    function colocarAleatorio() {
        const available = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    available.push({ x: i, y: j });
                }
            }
        }

        if (available.length > 0) {
            const randomCell = available[Math.floor(Math.random() * available.length)];
            board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
            const cell = document.querySelector(`[data-row="${randomCell.x}"][data-col="${randomCell.y}"]`);
            cell.classList.add('new-tile'); 
        }
    }

    function mover(direccion) {
        let haCambiado = false;
        if (direccion === 'ArrowUp' || direccion === 'ArrowDown') {
            for (let j = 0; j < size; j++) {
                const column = [...Array(size)].map((_, i) => board[i][j]);
                const nuevaColumna = transformar(column, direccion === 'ArrowUp');
                for (let i = 0; i < size; i++) {
                    if (board[i][j] !== nuevaColumna[i]) {
                        haCambiado = true;
                        board[i][j] = nuevaColumna[i];
                    }
                }
            }
        } else if (direccion === 'ArrowLeft' || direccion === 'ArrowRight') {
            for (let i = 0; i < size; i++) {
                const row = board[i];
                const nuevaFila = transformar(row, direccion === 'ArrowLeft');
                if (row.join(',') !== nuevaFila.join(',')) {
                    haCambiado = true;
                    board[i] = nuevaFila;
                }
            }
        }
        if (haCambiado) {
            colocarAleatorio();
            renderizarTablero();
            verificarFinJuego();
        }
    }

    function transformar(linea, moverAlInicio) {
        let nuevaLinea = linea.filter(cell => cell !== 0);
        if (!moverAlInicio) {
            nuevaLinea.reverse();
        }
        for (let i = 0; i < nuevaLinea.length - 1; i++) {
            if (nuevaLinea[i] === nuevaLinea[i + 1]) {
                nuevaLinea[i] *= 2;
                actualizarPuntaje(nuevaLinea[i]);
                nuevaLinea.splice(i + 1, 1);
            }
        }
        while (nuevaLinea.length < size) {
            nuevaLinea.push(0);
        }
        if (!moverAlInicio) {
            nuevaLinea.reverse();
        }
        return nuevaLinea;
    }

    function verificarFinJuego() {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    return;
                }
                if (j < size - 1 && board[i][j] === board[i][j + 1]) {
                    return;
                }
                if (i < size - 1 && board[i][j] === board[i + 1][j]) {
                    return;
                }
            }
        }

        gameOverElem.style.display = 'flex';
    }
    /* === Controles táctiles: integrar con el juego === */
    (function() {
  const dirToKey = {
    'up': 'ArrowUp',
    'down': 'ArrowDown',
    'left': 'ArrowLeft',
    'right': 'ArrowRight'
  };

  function sendMoveKey(keyName) {
    // Primera opción: si existe una función global que maneje la entrada (p. ej. handleInput)
    try {
      if (typeof window.handleInput === 'function') {
        // Llamada directa (mejor si tu juego ya exporta una función)
        window.handleInput(keyName);
        return;
      }
    } catch (e) {
      // continuar al fallback si hay algún error
      console.warn('Error llamando handleInput:', e);
    }

    // Fallback: despachar evento KeyboardEvent para imitar la tecla
    // Esto hace que cualquier listener de 'keydown' en document lo reciba.
    const ev = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
  }

  // atajo: acepta clicks y también touchstart para mejor respuesta táctil
  const buttons = document.querySelectorAll('#touch-controls .arrow');
  buttons.forEach(btn => {
    // click normal
    btn.addEventListener('click', (e) => {
      const dir = btn.dataset.dir;
      const key = dirToKey[dir];
      sendMoveKey(key);
      e.preventDefault();
    });

    // touchstart reduce latencia en móviles (y evita el retardo de 300ms en navegadores antiguos)
    btn.addEventListener('touchstart', (e) => {
      const dir = btn.dataset.dir;
      const key = dirToKey[dir];
      sendMoveKey(key);
      // prevenir doble disparo (touch -> click)
      e.preventDefault();
    }, { passive: false });
  });
})();
    

    document.addEventListener('keydown', event => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            mover(event.key);
        }
    });
    document.getElementById('restart-btn').addEventListener('click', reiniciarJuego);

    inicializarJuego();
});
