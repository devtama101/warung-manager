import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Wifi,
  WifiOff,
  Users,
  BarChart3,
  Package,
  Smartphone,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Monitor,
  Database,
  Cloud,
  Store,
  Utensils,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "Warung Digital Tanpa Internet",
      description: "Catat pesanan dan stok tanpa perlu koneksi. Data aman tersimpan lokal.",
      icon: <Store className="h-12 w-12 text-amber-700" />,
      color: "text-amber-700"
    },
    {
      title: "Kelola dari Banyak Perangkat",
      description: "Atur warung dari HP, tablet, atau laptop dengan sinkronisasi otomatis.",
      icon: <Smartphone className="h-12 w-12 text-green-700" />,
      color: "text-green-700"
    },
    {
      title: "Laporan Penjualan Lengkap",
      description: "Pantau keuntungan, stok barang, dan penjualan terlaris dengan mudah.",
      icon: <BarChart3 className="h-12 w-12 text-blue-700" />,
      color: "text-blue-700"
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-100/70">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400/80 to-orange-400/80 rounded-lg flex items-center justify-center shadow-sm">
                <Store className="h-5 w-5 text-white/90" />
              </div>
              <span className="text-xl font-bold text-amber-800/90">Warung Manager</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-amber-700/80 hover:text-amber-600/90 transition-colors font-medium">
                Fitur
              </button>
              <button onClick={() => scrollToSection('benefits')} className="text-amber-700/80 hover:text-amber-600/90 transition-colors font-medium">
                Keunggulan
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-amber-700/80 hover:text-amber-600/90 transition-colors font-medium">
                Harga
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/warung/login">
                <Button variant="outline" size="sm" className="border-amber-200/60 text-amber-700/80 hover:bg-amber-50/50 hover:text-amber-600/90">
                  Masuk
                </Button>
              </Link>
              <Link to="/warung/register">
                <Button size="sm" className="bg-gradient-to-r from-amber-500/70 to-orange-500/70 hover:from-amber-600/80 hover:to-orange-600/80 text-white/90 shadow-sm">
                  Mulai Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Traditional Pattern */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-amber-100/60 shadow-sm">
              <Utensils className="h-5 w-5 text-amber-600/80" />
              <span className="text-amber-700/90 font-medium">Solusi Digital untuk Warung Tradisional</span>
              <Coffee className="h-5 w-5 text-amber-600/80" />
            </div>
          </div>

          <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-600/80 via-orange-500/80 to-amber-600/90 bg-clip-text text-transparent">
              Warung Manager Digital
            </h1>
            <p className="text-xl md:text-2xl text-amber-800/90 max-w-3xl mx-auto leading-relaxed">
              Aplikasi kasir modern untuk warung & kedai Indonesia.
              <span className="block text-amber-600/80 font-medium mt-3 text-lg">
                🏪 Tanpa Internet • 📱 Multi-device • 🔄 Auto-sync
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/warung/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-500/70 to-orange-500/70 hover:from-amber-600/80 hover:to-orange-600/80 text-white/90 text-lg px-8 py-4 shadow-md border border-amber-200/50">
                  🎉 Mulai Gratis Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/warung/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border border-amber-200/60 text-amber-700/80 hover:bg-amber-50/50 text-lg px-8 py-4">
                  Masuk Akun
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Rotator */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-2xl shadow-md p-6 border border-amber-100/50">
              <div className="flex items-center justify-center space-x-4">
                {features[currentFeature].icon}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-amber-800/90">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-amber-600/80">
                    {features[currentFeature].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white/90 via-amber-50/40 to-orange-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-amber-50/60 px-4 py-2 rounded-full mb-4 border border-amber-100/50">
              <Store className="h-5 w-5 text-amber-600/80" />
              <span className="text-amber-700/90 font-medium">Fitur Unggulan</span>
            </div>
            <h2 className="text-4xl font-bold text-amber-800/90 mb-4">
              Solusi Lengkap untuk Warung Anda
            </h2>
            <p className="text-xl text-amber-600/80 max-w-3xl mx-auto">
              Dirancang khusus untuk pemilik warung & kedai di Indonesia dengan teknologi modern
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 border border-amber-200/60 shadow-md bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100/60 to-orange-100/40 rounded-lg flex items-center justify-center mb-4">
                  <WifiOff className="h-6 w-6 text-amber-600/80" />
                </div>
                <CardTitle className="text-xl text-amber-800/90">📶 Tanpa Internet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-600/80">
                  Tetap buka warung meski mati lampu atau internet putus. Data aman tersimpan di HP.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-amber-200/60 shadow-md bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100/60 to-emerald-100/40 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600/80" />
                </div>
                <CardTitle className="text-xl text-amber-800/90">👥 Karyawan Gantian</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-600/80">
                  Istri, suami, atau pegawai bisa bergantian pakai. Setiap device punya akun sendiri.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-amber-200/60 shadow-md bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100/60 to-indigo-100/40 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600/80" />
                </div>
                <CardTitle className="text-xl text-amber-800/90">📊 Laporan Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-600/80">
                  Tahu untung rugi setiap hari. Menu paling laku dan jam tersibuk warung Anda.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-amber-200/60 shadow-md bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100/60 to-yellow-100/40 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-orange-600/80" />
                </div>
                <CardTitle className="text-xl text-amber-800/90">📦 Pantau Stok Barang</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-600/80">
                  Tahu kapan harus beli lagi. Otomatis hitung stok yang terjual dari pesanan.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-amber-200/60 shadow-md bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-100/60 to-pink-100/40 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-red-600/80" />
                </div>
                <CardTitle className="text-xl text-amber-800/90">📱 Bisa di HP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-600/80">
                  Pakai dimana saja. Dapur, kasir, atau saat di luar warung. Tetap bisa input pesanan.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border border-amber-200/60 shadow-md bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100/60 to-blue-100/40 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600/80" />
                </div>
                <CardTitle className="text-xl text-amber-800/90">🔒 Data Aman</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-600/80">
                  Data warung Anda tersimpan aman. Tidak akan hilang meski HP hilang atau rusak.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full mb-4 border border-amber-100/60">
              <Coffee className="h-5 w-5 text-amber-600/80" />
              <span className="text-amber-700/90 font-medium">Keunggulan</span>
              <Utensils className="h-5 w-5 text-amber-600/80" />
            </div>
            <h2 className="text-4xl font-bold text-amber-800/90 mb-4">
              Kenapa Warung Indonesia Suka?
            </h2>
            <p className="text-xl text-amber-600/80">
              Sudah digunakan ratusan warung dari Sabang sampai Merauke
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100/60 to-orange-100/40 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-200/60">
                  <CheckCircle className="h-5 w-5 text-amber-600/80" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800/90 mb-2">
                    📶 Tetap Buka Meski Internet Putus
                  </h3>
                  <p className="text-amber-600/80">
                    Warung tetap bisa jualan pas mati lampu atau wifi down. Data langsung ke save di HP.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100/60 to-emerald-100/40 rounded-full flex items-center justify-center flex-shrink-0 border border-green-200/60">
                  <CheckCircle className="h-5 w-5 text-green-600/80" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800/90 mb-2">
                    ⚡ Lebih Cepat, Lebih Praktis
                  </h3>
                  <p className="text-amber-600/80">
                    Tinggal klik pesanan, stok otomatis kehitung. Laporan langsung jadi tanpa ngitung manual.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    📱 Buka di HP atau Laptop
                  </h3>
                  <p className="text-amber-700">
                    Suami di kasir, istri di dapur tetap sinkron. Data sama di semua perangkat.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-purple-200">
                  <CheckCircle className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    📈 Tahu Untung Rugi
                  </h3>
                  <p className="text-amber-700">
                    Cek laporan penjualan setiap hari. Tahu menu laku dan waktu paling ramai.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-amber-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-amber-200">
                  <span className="text-amber-800 font-medium">⏰ Hemat Waktu</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-amber-200">
                  <span className="text-amber-800 font-medium">👌 Mudah Pakai</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-amber-200">
                  <span className="text-amber-800 font-medium">📶 Jualan Offline</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-amber-200">
                  <span className="text-amber-800 font-medium">💾 Data Aman</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                </div>

                <div className="text-center pt-4 bg-white/40 rounded-lg border border-amber-200/60">
                  <div className="text-3xl font-bold text-amber-700/90">⭐ 4.9/5</div>
                  <div className="text-amber-600/80 font-medium">Testimoni 300+ Pemilik Warung</div>
                  <div className="text-sm text-amber-500/70 mt-1">"Aplikasi warung terbaik!" - Bapak Rohman, Warung Nasi Padang</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white/90 via-amber-50/40 to-orange-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-amber-50/60 px-4 py-2 rounded-full mb-4 border border-amber-100/50">
              <span className="text-amber-700/90 font-medium">💰 Harga Bersahabat</span>
            </div>
            <h2 className="text-4xl font-bold text-amber-800/90 mb-4">
              Harga Pas untuk Kantong Warung
            </h2>
            <p className="text-xl text-amber-600/80">
              Mulai gratis, naik kelas saat warung makin laris
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="relative hover:shadow-lg transition-all duration-300 border border-amber-200/60 bg-white/60 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="text-sm font-medium text-amber-600/80 uppercase tracking-wide mb-2">
                  🌱 Mulai
                </div>
                <div className="text-4xl font-bold text-amber-800/90 mb-2">
                  Gratis
                </div>
                <div className="text-amber-600/80">
                  Selamanya untuk 1 device
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">1 Device</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">100 Order/bulan</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Laporan Dasar</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Support Email</span>
                </div>
                <Link to="/warung/register">
                  <Button className="w-full mt-6 border-amber-300 text-amber-800 hover:bg-amber-50" variant="outline">
                    Mulai Gratis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative hover:shadow-2xl transition-all duration-300 border-2 border-amber-500 transform scale-105 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  🔥 Paling Laris
                </div>
              </div>
              <CardHeader className="text-center">
                <div className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">
                  💼 Bisnis
                </div>
                <div className="text-4xl font-bold text-amber-900 mb-2">
                  Rp 99K
                </div>
                <div className="text-amber-700">
                  per bulan
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Banyak Device</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Order Tanpa Batas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Laporan Lengkap</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Support Cepat</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Laporan Kustom</span>
                </div>
                <Link to="/warung/register">
                  <Button className="w-full mt-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg">
                    Coba 7 Hari Gratis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative hover:shadow-2xl transition-all duration-300 border-2 border-amber-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="text-sm font-medium text-amber-600 uppercase tracking-wide mb-2">
                  🏢 Usaha Besar
                </div>
                <div className="text-4xl font-bold text-amber-900 mb-2">
                  Custom
                </div>
                <div className="text-amber-700">
                  Untuk franchise/rantai
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Semua Fitur Bisnis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Kelola Banyak Cabang</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Koneksi Sistem Lain</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Support Khusus</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Fitur Kustom</span>
                </div>
                <Link to="/warung/register">
                  <Button className="w-full mt-6 border-amber-300 text-amber-800 hover:bg-amber-50" variant="outline">
                    Hubungi Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-amber-500/80 via-orange-500/70 to-amber-600/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white/95 mb-6">
            🎉 Siap Tingkatkan Omset Warung Anda?
          </h2>
          <p className="text-xl text-amber-50/90 mb-8">
            Bergabung dengan 300+ warung Indonesia yang sudah untung menggunakan Warung Manager
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/warung/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white/90 text-amber-600/90 hover:bg-white/95 font-semibold">
                🚀 Mulai Gratis Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/warung/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white/70 text-white/90 hover:bg-white/90 hover:text-amber-600/90 font-semibold">
                👀 Lihat Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-amber-800/80 via-amber-700/70 to-orange-800/80 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Warung Manager</span>
              </div>
              <p className="text-amber-200">
                Aplikasi kasir digital untuk warung & kedai Indonesia. Offline-first, tetap jualan tanpa internet!
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">🌟 Fitur Utama</h3>
              <ul className="space-y-2 text-amber-200">
                <li>Catatan Pesanan</li>
                <li>Pantau Stok Barang</li>
                <li>Laporan Penjualan</li>
                <li>Banyak Pengguna</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">🏢 Tentang</h3>
              <ul className="space-y-2 text-amber-200">
                <li>Tentang Kami</li>
                <li>Cara Kerja</li>
                <li>Testimoni</li>
                <li>Kontak</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">💾 Bantuan</h3>
              <ul className="space-y-2 text-amber-200">
                <li>Panduan Pengguna</li>
                <li>Video Tutorial</li>
                <li>FAQ</li>
                <li>Hubungi Support</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-amber-600/50 mt-8 pt-8 text-center text-amber-200/80">
            <p>&copy; 2024 Warung Manager. 💛 Crafted by <a href="https://webartisan.id" target="_blank" rel="noopener noreferrer" className="hover:text-amber-100 transition-colors">webartisan.id</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}