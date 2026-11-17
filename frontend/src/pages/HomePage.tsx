import { About } from "../components/About/About";
import { Footer } from "../components/Footer/Footer";
import { Hero } from "../components/Hero/Hero";
import { Header } from "../components/Header/Header";
import {Contact} from "../components/Contact/Contact"
import Services from "../components/Services/Services"

export default function Home() {
  return(
    <div>
      <Header />
      <Hero />
    <About />
    <Services />
    <Contact />
    <Footer />
    
    </div>
  )
}