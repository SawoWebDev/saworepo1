  import Header from "../components/Header/Header";
  import Footer from "../components/Footer/Footer";

  export default function MainLayout({ children }) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-[#333] font-[Montserrat] transition-colors duration-300">
        {/* Fixed header with highest z-index */}
        <Header />

        {/* Main content */}
        <main className="flex-1 relative z-0">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    );
  }
