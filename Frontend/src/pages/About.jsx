import React from "react";
import { motion } from "framer-motion";
import './styles/about.css';

const creators = [
  {
    name: "Michael Angelo Z. Diaz",
    role: "UI/UX",
    flirt: `"Are you the UI? Because you just made my heart experience smooth transitions."`,
    img: "/images/about_img/michael.jpeg",
    link: "#"
  },
  {
    name: "John Michael Garcia",
    role: "Full Stack Developer",
    flirt: `"IDK at least its working."`,
    img: "/images/about_img/garcia.jpeg",
    link: "https://jaygarciaaa.github.io/MySpace/"
  },
  {
    name: "John Rhey D. Peña",
    role: "Backend Developer",
    flirt: `"You can't see me working, but I'll always be there to support you just like the backend."`,
    img: "/images/about_img/pens.jpeg",
    link: "https://jrhey124.github.io/Portfolio/"
  },
  {
    name: "Rham Ryan Ponce",
    role: "Frontend Developer",
    flirt: `"Is it hot in here or is it just my CSS making your heart flutter?"`,
    img: "/images/about_img/ponce.jpeg",
    link: "#"
  },
  {
    name: "Bernie Jr. Rivera",
    role: "JavaScript",
    flirt: `"Hmmm?"`,
    img: "/images/about_img/rivera.jpeg",
    link: "https://burniiiii.github.io/Web-Portfolio/"
  },
  {
    name: "King Rey Mark Samarita",
    role: "Frontend",
    flirt: `"Forget React, I'm already hooked on you!"`,
    img: "/images/about_img/samarita.jpeg",
    link: "https://nixxinix.github.io/my-portfolio/"
  }
];

const About = () => {
  return (
    <motion.section
      className="creators-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1>Meet the Creators</h1>
      <p className="desc">We are OR1-1, the creators of Cook Eat — a site to solve cravings while making friends.</p>

      <div className="creators-grid">
        {creators.map((creator, i) => (
          <motion.a
            key={i}
            className="creator-card"
            href={creator.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <span className="ripple"></span>
            <img src={creator.img} alt={creator.name} />
            <h2>{creator.name}</h2>
            <p className="role">{creator.role}</p>
            <p className="flirt">{creator.flirt}</p>
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
};

export default About;
