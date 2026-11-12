import Hero from "../../Components/Hero/Hero";
import About from "../../Components/About/About";
import CreativeSkills from "../../Components/CreativeSkills/CreativeSkills";
import FeaturedProjects from "../../Components/FeaturedProjects/FeaturedProjects";
import Courses from "../../Components/Courses/Courses";
import Contact from "../../Components/Contact/Contact";
import Footer from "../../Components/Footer/Footer";
import Navbar from "../../Components/Navbar/Navbar";
import usePageTitle from "../../hooks/usePageTitle";

function Home() {
  usePageTitle();

  return (
    <>
    <Navbar />
      <Hero />
      <About />
      <CreativeSkills />
      <FeaturedProjects />
      <Courses />
      <Contact />
      <Footer />
    </>
  );
}

export default Home;