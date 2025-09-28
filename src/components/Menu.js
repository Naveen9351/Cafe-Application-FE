import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCartContext } from '../context/CartContext';
import { Link, useLocation } from 'react-router-dom';
// import { Navbar2, Footer2 } from 'naveen-ui';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Menu.module.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const menuItems = [
  { label: 'Home', link: '/' },
  {
    label: 'Products',
    link: '#',
    children: [
      { label: 'Product 1', link: '#product1' },
      { label: 'Product 2', link: '#product2' },
    ],
  },
  { label: 'About', link: '/about' },
  { label: 'Contact', link: '/contact' },
];

function Menu() {
  const [items, setItems] = useState([]);
  const { addItem, cartItems } = useCartContext();
  const location = useLocation();

  useEffect(() => {
    axios
      .get(`${API}/menu`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Error fetching menu:', err));
  }, []);

  const handleAddToCart = (item) => {
    addItem({ id: item._id, name: item.name, price: item.price });
    toast.success(`${item.name} added to cart!`, {
      position: 'top-right',
      duration: 3000,
      style: {
        background: '#4caf50',
        color: '#fff',
        fontSize: '16px',
        padding: '10px 20px',
      },
    });
  };

  const isCartPage = location.pathname === '/cart';

  return (
    <div className={styles.pageWrapper}>
      {/* Toast Container */}
      <Toaster />



      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to Cafe Delight</h1>
        <p className={styles.heroSubtitle}>
          Discover our delicious menu crafted with love and care. Order now and enjoy!
        </p>
      </section>

      {/* Menu Section */}
      <section className={styles.container}>
        <h2 className={styles.title}>Our Menu</h2>
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item._id} className={styles.card}>
              <img src={item.image} alt={item.name} className={styles.image} />
              <div className={styles.cardContent}>
                <h3 className={styles.itemTitle}>{item.name}</h3>
                <p className={styles.description}>{item.description}</p>
                <p className={styles.price}>{item.price.toFixed(2)} rs</p>
                <button
                  onClick={() => handleAddToCart(item)}
                  className={styles.button}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Button */}
      <Link to="/cart" className={styles.cartButton}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {!isCartPage && cartItems?.length > 0 && (
          <span className={styles.cartBadge}>{cartItems.length}</span>
        )}
      </Link>

    </div>
  );
}

export default Menu;