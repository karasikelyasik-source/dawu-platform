import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Ayce from "../components/Ayce";
import Gallery from '../components/Gallery';
import Reservation from '../components/Reservation';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070504] text-white">
      <Header />
      <Hero />
      <About />
      <Ayce />
      <Gallery />
      <Reservation />
    </main>
  );
}