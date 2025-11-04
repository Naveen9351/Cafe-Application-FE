import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useCartContext } from '../context/CartContext';
import { Link, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Menu.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';

function Menu() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('');
  const { addItem, cartItems } = useCartContext();
  const [searchParams] = useSearchParams();

  // Static categories
  const staticCategories = [
    { id: 'all', name: 'All' },
    { id: 'chai', name: 'Chai' },
    { id: 'cold-coffee', name: 'Cold Coffee' },
    { id: 'hot-coffee', name: 'Hot Coffee' },
    { id: 'maggi', name: 'Maggi' },
    { id: 'burger', name: 'Burger' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'chinese', name: 'Chinese' },
    { id: 'sandwich', name: 'Sandwich' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'wraps', name: 'Wraps' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'cold-drinks', name: 'Cold Drinks' },
    { id: 'mocktails', name: 'Mocktails' },
    { id: 'juices', name: 'Juices' },
    { id: 'shakes', name: 'Shakes' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'cakes', name: 'Cakes' },
    { id: 'water', name: 'Water' },
    { id: 'cigarettes', name: 'Cigarettes' },
    { id: 'disposables', name: 'Disposables' },
    { id: 'dips', name: 'Dips' },
  ];

  // Calculate total items in cart (with quantity)
  const totalCartItems = useMemo(() => {
    return cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  // Load table number + fetch menu
  useEffect(() => {
    const urlTable = searchParams.get('table');
    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem('tableNumber', urlTable);
    } else {
      const stored = localStorage.getItem('tableNumber');
      if (stored) setTableNumber(stored);
    }

    axios
      .get(`${API}/menu`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Error fetching menu:', err));
  }, [searchParams]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    return selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const handleAddToCart = (item) => {
    addItem({
      id: item._id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      quantity: 1,
    });
    toast.success(`${item.name} added to cart!`, {
      style: { borderRadius: '10px', background: '#ffffffff', color: '#222222ff' },
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-center" />

      {/* Top-Right Cart Badge */}
      {totalCartItems > 0 && (
        <div className={styles.cartnumber}>{totalCartItems}</div>
      )}

      {/* Sticky Header */}
      <header className={styles.stickyHeader}>
        <img src="https://imgs.search.brave.com/7BfltBlWb5-AXLT4j4mcGh6hESSrJAQ4iMtgwKuNgoM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMDcv/OTg0LzIwNC9zbWFs/bC9lbGVnYW50LWxv/Z28tZm9yLXlvdXIt/Y29mZmVlLXNob3At/ZnJlZS12ZWN0b3Iu/anBn" alt="Cafe Delight" className={styles.logo} />
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <h1 className={styles.heroTitle}>Cafe Delight</h1>
        <p className={styles.heroSubtitle}>
          Artisanal coffee • Fresh bites • Cozy vibes
        </p>
        {tableNumber && (
          <p className={styles.tableInfo}>Table #{tableNumber}</p>
        )}
      </section>

      {/* Categories Filter */}
      <section className={styles.categoriesSection}>
        <div className={styles.categoryScroll}>
          {staticCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.pill} ${
                selectedCategory === category.id ? styles.pillActive : ''
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
                <div className={styles.imgWrap}>
                  <img
                    src={item.image || '/default-food-image.jpg'}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = '/default-food-image.jpg';
                    }}
                  />
                  <span className={styles.priceBadge}>₹{item.price}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>
                  <p className={styles.categoryTag}>
                    {item.categoryName || item.category}
                  </p>
                  {item.description && (
                    <p className={styles.desc}>{item.description}</p>
                  )}
                  <button
                    onClick={() => handleAddToCart(item)}
                    className={styles.addBtn}
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

      {/* Floating Cart Button */}
      <Link
        to={`/cart?table=${tableNumber}`}
        className={styles.cartButton}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
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
        {totalCartItems > 0 && (
          <span className={styles.cartBadge}>{totalCartItems}</span>
        )}
      </Link>
    </div>
  );
}

export default Menu;