import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import { AccountProvider } from "./context/AccountContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ListContextProvider } from "./context/ListContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LanguageWelcomeModal from "./components/LanguageWelcomeModal";
import Home from "./pages/Home";
import ProductsPage from "./pages/ProductsPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import ProductDetails from "./pages/ProductDetails";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import WishlistPage from "./pages/WishlistPage";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorBoundary from "./components/ErrorBoundary";

function AppShell() {
  const { hasChosenLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [showWelcome, setShowWelcome] = useState(!hasChosenLanguage);
  const historySeeded = useRef(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (!isHome) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isHome]);

  // Mobile/device Back safety: when the app is opened directly on an overlay
  // route (product/category/search/…) with no earlier in-site entry, seed a
  // home entry underneath so the physical BACK button returns to the previous
  // in-site state instead of leaving the website. Runs exactly once per load
  // and never adds duplicate entries for normal in-app navigation.
  useEffect(() => {
    if (historySeeded.current) return;
    historySeeded.current = true;
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (!isHome && idx <= 0) {
      const deep = location.pathname + location.search;
      navigate("/", { replace: true });
      navigate(deep, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable element reference for the decorative backdrop copy of Home: React
  // skips re-rendering it while overlay routes change (no double work).
  const backdropHome = useMemo(() => <Home />, []);

  return (
    <div className="relative min-h-screen">
      {/* Decorative animated purple/theme glow blobs — preserved visual identity */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -top-24 -left-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--accent-1)" }}
        />
        <div
          className="animate-blob-slow absolute top-1/3 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--accent-3)" }}
        />
        <div
          className="animate-blob absolute bottom-0 left-1/4 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--accent-2)" }}
        />
      </div>

      {showWelcome && <LanguageWelcomeModal onDone={() => setShowWelcome(false)} />}

      <Header />
      <main>
        {!isHome && <div className="min-h-screen" aria-hidden="true">{backdropHome}</div>}
        <div className={isHome ? "" : "fixed inset-0 z-[100] overflow-y-auto bg-black/45 px-2 py-6 backdrop-blur-sm sm:px-6"}>
          <div className={isHome ? "" : "glass-strong animate-fade-up mx-auto my-4 max-h-[88vh] w-[92vw] max-w-6xl overflow-y-auto rounded-3xl"}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <AccountProvider>
            <WishlistProvider>
              <CartProvider>
                <ListContextProvider>
                  <BrowserRouter>
                    <ErrorBoundary>
                      <AppShell />
                    </ErrorBoundary>
                  </BrowserRouter>
                </ListContextProvider>
              </CartProvider>
            </WishlistProvider>
          </AccountProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
