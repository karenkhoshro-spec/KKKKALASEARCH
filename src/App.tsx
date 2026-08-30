import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ListContextProvider } from "./context/ListContext";
import { UiLayerProvider } from "./context/UiLayerContext";
import { goBack } from "./utils/safeBack";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import { AccountProvider } from "./context/AccountContext";
import { WishlistProvider } from "./context/WishlistContext";
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
import WishlistPage from "./pages/WishlistPage";
import NotFoundPage from "./pages/NotFoundPage";
import ImageTestPage from "./pages/ImageTestPage";
import ErrorBoundary from "./components/ErrorBoundary";

function AppShell() {
  const { hasChosenLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [showWelcome, setShowWelcome] = useState(!hasChosenLanguage);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (!isHome) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isHome]);

  // Close overlay on ESC key (desktop)
  useEffect(() => {
    if (isHome) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        goBack(navigate);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHome, navigate]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      goBack(navigate);
    }
  };

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
        {!isHome && <div className="min-h-screen" aria-hidden="true"><Home /></div>}
        <div
          className={
            isHome
              ? ""
              : "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 px-2.5 py-6 backdrop-blur-md sm:px-6"
          }
          onClick={isHome ? undefined : handleBackdropClick}
        >
          <div
            className={
              isHome
                ? ""
                : "glass-strong mx-auto my-auto max-h-[88vh] w-[94vw] max-w-5xl overflow-y-auto rounded-[28px] border shadow-2xl"
            }
            style={isHome ? undefined : { borderColor: "var(--border-strong)" }}
            onClick={isHome ? undefined : (e) => e.stopPropagation()}
          >
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
              <Route path="/image-test" element={<ImageTestPage />} />
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
                    <UiLayerProvider>
                      <ErrorBoundary>
                        <AppShell />
                      </ErrorBoundary>
                    </UiLayerProvider>
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
