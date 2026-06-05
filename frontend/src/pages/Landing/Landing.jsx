import Navbar from '../../components/Landing/Navbar';
import Hero from '../../components/Landing/Hero';
import Benefits from '../../components/Landing/Benefits';
import HowItWorks from '../../components/Landing/HowItWorks';
import Testimonials from '../../components/Landing/Testimonials';
import Packages from '../../components/Landing/Packages';
import CTASection from '../../components/Landing/CTASection';
import Footer from '../../components/Landing/Footer';

export default function Landing() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <Hero />
      <Benefits />
      <HowItWorks />
      <Testimonials />
      <Packages />
      <CTASection />
      <Footer />
    </div>
  );
}
