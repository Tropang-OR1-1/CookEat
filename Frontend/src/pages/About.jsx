import React from "react";
import './styles/about.css';

const About = () => {
  return (
      <section className="creators-section">
        <h1>Meet the Creators</h1>
        <p className="desc">We are OR1-1, the creators of Cook Eat — a site to solve cravings while making friends.</p>

        <div className="creators-grid">
          <a href="#" target="_blank" rel="noopener noreferrer" className="creator-card">
            <span className="ripple"></span>
            <img src="/images/about_img/michael.jpeg" alt="Michael Angelo Z. Diaz" />
            <h2>Michael Angelo Z. Diaz</h2>
            <p className="role">UI/UX</p>
            <p className="flirt">"Are you the UI? Because you just made my heart experience smooth transitions."</p>
          </a>

          <a href="https://jaygarciaaa.github.io/MySpace/" target="_blank" rel="noopener noreferrer" className="creator-card">
            <span className="ripple"></span>
            <img src="/images/about_img/garcia.jpeg" alt="John Michael Garcia" />
            <h2>John Michael Garcia</h2>
            <p className="role">Full Stack Developer</p>
            <p className="flirt">"IDK at least its working."</p>
          </a>

          <a href="https://jrhey124.github.io/Portfolio/" target="_blank" rel="noopener noreferrer" className="creator-card">
            <span className="ripple"></span>
            <img src="/images/about_img/pens.jpeg" alt="John Rhey D. Peña" />
            <h2>John Rhey D. Peña</h2>
            <p className="role">Backend Developer</p>
            <p className="flirt">"You can’t see me working, but I’ll always be there to support you just like the backend."</p>
          </a>

          <a href="#" target="_blank" rel="noopener noreferrer" className="creator-card">
            <span className="ripple"></span>
            <img src="/images/about_img/ponce.jpeg" alt="Rham Ryan Ponce" />
            <h2>Rham Ryan Ponce</h2>
            <p className="role">Frontend Developer</p>
            <p className="flirt">"Is it hot in here or is it just my CSS making your heart flutter?"</p>
          </a>

          <a href="https://burniiiii.github.io/Web-Portfolio/" target="_blank" rel="noopener noreferrer" className="creator-card">
            <span className="ripple"></span>
            <img src="/images/about_img/rivera.jpeg" alt="Bernie Jr. Rivera" />
            <h2>Bernie Jr. Rivera</h2>
            <p className="role">JavaScript</p>
            <p className="flirt">"Hmmm?"</p>
          </a>

          <a href="#" target="_blank" rel="noopener noreferrer" className="creator-card">
            <span className="ripple"></span>
            <img src="/images/about_img/samarita.jpeg" alt="King Rey Mark Samarita" />
            <h2>King Rey Mark Samarita</h2>
            <p className="role">Frontend</p>
            <p className="flirt">"Forget React, I’m already hooked on you!"</p>
          </a>
        </div>
      </section>
  );
};

export default About;
