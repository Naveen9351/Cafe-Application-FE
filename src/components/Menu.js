import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCartContext } from '../context/CartContext';
import { Link, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Menu.module.css';
import QRCodeComponent from './QRCodeComponent';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('');
  const { addItem, cartItems } = useCartContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Extract table number from URL query parameter
    const urlTableNumber = searchParams.get('table');
    if (urlTableNumber) {
      setTableNumber(urlTableNumber);
      localStorage.setItem('tableNumber', urlTableNumber);
    } else {
      // Check if table number exists in localStorage
      const storedTableNumber = localStorage.getItem('tableNumber');
      if (storedTableNumber) {
        setTableNumber(storedTableNumber);
      }
    }

    // Fetch categories
    axios
      .get(`${API}/categories`)
      .then((res) => {
        setCategories([{ id: 'all', name: 'All Categories' }, ...res.data]);
      })
      .catch((err) => console.error('Error fetching categories:', err));

    // Fetch all menu items
    axios
      .get(`${API}/menu`)
      .then((res) => {
        setItems(res.data);
      })
      .catch((err) => console.error('Error fetching menu:', err));
  }, [searchParams]);

  // Filter items by category
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item) => {
    addItem({ 
      id: item._id, 
      name: item.name, 
      price: item.price,
      category: item.category,
      image: item.image
    });
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

  // Generate table-specific QR URL
  const getQRUrl = (tableNum) => {
    return `https://cafe-application-fe.vercel.app/menu?table=${tableNum}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <Toaster />

      {/* Display Table Number */}
      {tableNumber && (
        <div className={styles.tableInputContainer}>
          <p className={styles.tableDisplay}>
            <strong>Table: #{tableNumber}</strong>
          </p>
          <QRCodeComponent url={getQRUrl(tableNumber)} tableNumber={tableNumber} />
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to Cafe Delight</h1>
        <p className={styles.heroSubtitle}>
          Discover our delicious menu crafted with love and care. Order now and enjoy!
        </p>
      </section>

      {/* Categories Filter */}
      <section className={styles.categoriesSection}>
        <div className={styles.categoryTabs}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${
                selectedCategory === category.id ? styles.activeCategory : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Menu Section */}
      <section className={styles.container}>
        <h2 className={styles.title}>Our Menu</h2>
        {filteredItems.length === 0 ? (
          <p className={styles.noItems}>No items found in this category.</p>
        ) : (
          <div className={styles.grid}>
            {filteredItems.map((item) => (
              <div key={item._id} className={styles.card}>
                <img 
                  src={item.image || '/default-food-image.jpg'} 
                  alt={item.name} 
                  className={styles.image}
                  onError={(e) => {
                    e.target.src = '/default-food-image.jpg';
                  }}
                />
                <div className={styles.cardContent}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>
                  <p className={styles.categoryTag}>{item.categoryName || item.category}</p>
                  <p className={styles.description}>{item.description}</p>
                  <p className={styles.price}>{item.price.toFixed(2)} rs</p>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className={styles.button}
                    disabled={!tableNumber}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cart Button */}
      <Link to={`/cart?table=${tableNumber}`} className={styles.cartButton}>
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
        {cartItems?.length > 0 && (
          <span className={styles.cartBadge}>{cartItems.length}</span>
        )}
      </Link>
    </div>
  );
}

export default Menu;