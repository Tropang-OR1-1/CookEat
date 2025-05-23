import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/loginregister.css';

function LoginRegister({ isOpen, onClose, setToken, setProfile, setAvatar }) {
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const onAuthSuccess = (token, user) => {
    const { public_id, username, profile } = user;

    const profilePic = profile
      ? `https://cookeat.cookeat.space/uploads/${profile}`
      : 'https://www.w3schools.com/howto/img_avatar.png';

    localStorage.setItem('token', token);
    localStorage.setItem('public_id', public_id);
    localStorage.setItem('profile', JSON.stringify({ username, avatar: profilePic }));
    localStorage.setItem('avatar', profilePic);

    setToken(token);
    if (setProfile) setProfile({ username, avatar: profilePic });
    if (setAvatar) setAvatar(profilePic);

    // This function runs once after login/register
    if (window.initSocketOnce) window.initSocketOnce(); 

    onClose();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('email', loginData.email);
      formData.append('password', loginData.password);

      const res = await axios.post('https://cookeat.cookeat.space/user/login', formData);
      const { token, user } = res.data;

      onAuthSuccess(token, user);
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', registerData.username);
      formData.append('email', registerData.email);
      formData.append('password', registerData.password);

      const res = await axios.post('https://cookeat.cookeat.space/user/register', formData);
      const { token, user } = res.data;
      
      onAuthSuccess(token, user);
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    }
  };

  const handleSwitchToRegister = () => {
    setIsRegisterMode(true);
    setShowRegisterForm(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterMode(false);
    setShowRegisterForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`modal ${isOpen ? 'show' : ''}`} onClick={(e) => e.target.classList.contains('modal') && onClose()}>
      <div className={`container ${isRegisterMode ? 'active' : ''}`}>
        <div className={`form-box ${showRegisterForm ? 'register' : 'login'}`}>
          {showRegisterForm ? (
            <form onSubmit={handleRegisterSubmit}>
              <h1>Registration</h1>
              <div className="input-box">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  required
                  value={registerData.username}
                  onChange={handleRegisterChange}
                />
              </div>
              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={registerData.email}
                  onChange={handleRegisterChange}
                />
              </div>
              <div className="input-box">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={registerData.password}
                  onChange={handleRegisterChange}
                />
              </div>
              <button type="submit" className="btn large">Register</button>
              <p>or register with social platforms</p>
              {isMobile ? (
                <button className="btn" onClick={handleSwitchToLogin}>Login</button>
              ) : (
                <div className="social-icons">
                  <a href="#"><i className='bx bxl-google'></i></a>
                  <a href="#"><i className='bx bxl-facebook'></i></a>
                  <a href="#"><i className='bx bxl-github'></i></a>
                  <a href="#"><i className='bx bxl-linkedin'></i></a>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit}>
              <h1>Login</h1>
              <div className="input-box">
                <input
                  type="text"
                  name="email"
                  placeholder="Email"
                  required
                  value={loginData.email}
                  onChange={handleLoginChange}
                />
              </div>
              <div className="input-box">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={loginData.password}
                  onChange={handleLoginChange}
                />
              </div>
              <div className="forgot-link">
                <a href="#">Forgot password?</a>
              </div>
              <button type="submit" className="btn large">Login</button>
              <p>or login with social platforms</p>
              {isMobile ? (
                <button className="btn" onClick={handleSwitchToRegister}>Register</button>
              ) : (
                <div className="social-icons">
                  <a href="#"><i className='bx bxl-google'></i></a>
                  <a href="#"><i className='bx bxl-facebook'></i></a>
                  <a href="#"><i className='bx bxl-github'></i></a>
                  <a href="#"><i className='bx bxl-linkedin'></i></a>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Welcome to Cook Eat</h1>
            <p>Don't have an account?</p>
            <button className="btn large" onClick={handleSwitchToRegister}>Register</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome to Cook Eat!</h1>
            <p>Already have an account?</p>
            <button className="btn large" onClick={handleSwitchToLogin}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
