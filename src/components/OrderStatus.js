// OrderStatus.js
import React, { useState, useEffect, useMemo, useRef } from 'react';import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import ChromeDinoGame from 'react-chrome-dino';
import styles from './OrderStatus.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';
const socket = io(API, { reconnectionAttempts: 5 });

/* -----------------------------------------------------------------
   Pure‑JS Snake (canvas – no JSX)
   ----------------------------------------------------------------- */
function SnakeGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = 20;
    const tile = 20;
    let snake = [{ x: 10, y: 10 }];
    let food = randomFood();
    let dx = 0;
    let dy = 0;
    let running = true;
    let interval = null;

    function randomFood() {
      let pos;
      do {
        pos = { x: Math.floor(Math.random() * grid), y: Math.floor(Math.random() * grid) };
      } while (snake.some(s => s.x === pos.x && s.y === pos.y));
      return pos;
    }

    function draw() {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // snake
      ctx.fillStyle = '#15803d';
      snake.forEach(s => ctx.fillRect(s.x * tile, s.y * tile, tile - 2, tile - 2));

      // food
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(food.x * tile + tile / 2, food.y * tile + tile / 2, tile / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function step() {
      if (!running) return;
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      // wall / self
      if (head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid ||
          snake.some(s => s.x === head.x && s.y === head.y)) {
        endGame();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        food = randomFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function endGame() {
      running = false;
      setGameOver(true);
      toast.error(`Game Over! Score: ${score}`, { icon: 'Cross' });
    }

    const keyHandler = e => {
      if (!running) return;
      switch (e.key) {
        case 'ArrowUp':    if (dy !== 1) { dx = 0; dy = -1; } break;
        case 'ArrowDown':  if (dy !== -1) { dx = 0; dy = 1; } break;
        case 'ArrowLeft':  if (dx !== 1) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
      }
    };
    window.addEventListener('keydown', keyHandler);
    interval = setInterval(step, 150);
    draw();

    return () => {
      window.removeEventListener('keydown', keyHandler);
      clearInterval(interval);
    };
  }, [score]);

  const restart = () => window.location.reload();

  return React.createElement(
    'div',
    { className: styles.snakeContainer },
    React.createElement('div', { className: styles.score }, `Score: ${score}`),
    gameOver && React.createElement(
      'button',
      { className: styles.restartBtn, onClick: restart },
      'Restart'
    ),
    React.createElement('canvas', {
      ref: canvasRef,
      width: 300,
      height: 300,
      style: { display: 'block', margin: '0 auto' }
    })
  );
}

/* -----------------------------------------------------------------
   Main OrderStatus component – pure JS
   ----------------------------------------------------------------- */
function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeGame, setActiveGame] = useState('dino'); // dino | snake

  /* ---------- 1. Load order + localStorage fallback ---------- */
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API}/orders/status/${id}`);
        const o = res.data;
        setOrder(o);
        localStorage.setItem(`order_${id}`, JSON.stringify(o));
      } catch (err) {
        const cached = localStorage.getItem(`order_${id}`);
        if (cached) {
          setOrder(JSON.parse(cached));
          toast('Order restored from cache', { icon: 'Refresh' });
        } else {
          setError(err.response?.data?.error || 'Server error');
        }
      }
    };
    fetchOrder();

    const onUpdate = upd => {
      if (upd._id === id) {
        setOrder(upd);
        localStorage.setItem(`order_${id}`, JSON.stringify(upd));
        toast.success(`Status → ${upd.status}`);
      }
    };
    const onDelete = ({ id: delId }) => {
      if (delId === id) {
        setOrder(null);
        localStorage.removeItem(`order_${id}`);
        toast.error('Order cancelled');
      }
    };
    socket.on('orderUpdate', onUpdate);
    socket.on('orderDeleted', onDelete);
    return () => {
      socket.off('orderUpdate', onUpdate);
      socket.off('orderDeleted', onDelete);
    };
  }, [id]);

  /* ---------- 2. Progress bar (preparing) ---------- */
  useEffect(() => {
    if (!order || order.status !== 'preparing' || !order.estimatedTime || !order.timeSetAt) {
      setProgress(0);
      return;
    }
    const calc = () => {
      const start = new Date(order.timeSetAt).getTime();
      const total = order.estimatedTime * 60 * 1000;
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / total) * 100, 100));
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [order]);

  const timeRemaining = useMemo(() => {
    if (!order || order.status !== 'preparing') return null;
    const elapsed = (Date.now() - new Date(order.timeSetAt).getTime()) / 1000;
    const left = Math.max(0, order.estimatedTime * 60 - elapsed);
    return Math.ceil(left / 60);
  }, [order]);

  /* ---------- Render ---------- */
  if (error && !order) {
    return React.createElement(
      'div',
      { className: styles.container },
      React.createElement(Toaster),
      React.createElement('h1', { className: styles.title }, 'Order Not Found'),
      React.createElement('p', { className: styles.error }, error)
    );
  }

  if (!order) {
    return React.createElement(
      'div',
      { className: styles.container },
      React.createElement(Toaster),
      React.createElement('h1', { className: styles.title }, 'Loading...')
    );
  }

  return React.createElement(
    'div',
    { className: styles.container },
    React.createElement(Toaster, { position: 'top-center' }),

    /* ---- Title ---- */
    React.createElement('h1', { className: styles.title }, 'Order Status'),

    /* ---- Order Card ---- */
    React.createElement(
      'div',
      { className: styles.orderCard },
      React.createElement(
        'div',
        { className: styles.header },
        React.createElement('h2', null, `Table #${order.tableNumber}`),
        React.createElement(
          'span',
          { className: `${styles.status} ${styles[order.status]}` },
          order.status.charAt(0).toUpperCase() + order.status.slice(1)
        )
      ),

      order.status === 'preparing' && timeRemaining !== null
        ? React.createElement(
            'div',
            null,
            React.createElement('p', { className: styles.timeRemaining }, `${timeRemaining} min left`),
            React.createElement(
              'div',
              { className: styles.progressBar },
              React.createElement('div', {
                className: styles.progressFill,
                style: { width: `${progress}%` }
              })
            )
          )
        : React.createElement('p', { className: styles.estimated }, `Est. ${order.estimatedTime} min`),

      React.createElement(
        'div',
        { className: styles.items },
        order.items.map((it, i) =>
          React.createElement(
            'div',
            { key: it._id, className: styles.itemRow },
            React.createElement('span', null, it.name),
            React.createElement('span', null, `× ${order.quantities[i]}`)
          )
        )
      ),
      React.createElement('div', { className: styles.total }, `₹${order.total.toFixed(2)}`)
    ),

    /* ---- Games ---- */
    React.createElement(
      'div',
      { className: styles.gamesSection },
      React.createElement('h3', null, 'While you wait… Play!'),
      React.createElement(
        'div',
        { className: styles.gameTabs },
        React.createElement(
          'button',
          {
            className: activeGame === 'dino' ? styles.activeTab : '',
            onClick: () => setActiveGame('dino')
          },
          'Dino Run'
        ),
        React.createElement(
          'button',
          {
            className: activeGame === 'snake' ? styles.activeTab : '',
            onClick: () => setActiveGame('snake')
          },
          'Snake'
        )
      ),
      React.createElement(
        'div',
        { className: styles.gameWrapper },
        activeGame === 'dino'
          ? React.createElement(ChromeDinoGame)
          : React.createElement(SnakeGame)
      )
    )
  );
}

export default OrderStatus;