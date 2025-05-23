.options {
  position: relative;
  display: inline-block;
}

.more-icon {
  height: 30px !important;
  width: 30px !important;
}

.dropdown-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  user-select: none;
  color: #333;
  transition: color 0.2s ease;
}

.dropdown-btn:hover {
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #FF8700;
}

.dropdown-content {
  position: absolute;
  right: 0;
  background-color: #fff;
  min-width: 150px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border-radius: 8px;
  opacity: 0;
  transform: scaleY(0);
  transform-origin: top;
  transition: opacity 0.3s ease, transform 0.3s ease;
  display: block;
  border: 2px solid #FF8700;
}

.dropdown-content.show {
  opacity: 1;
  transform: scaleY(1);
}

.dropdown-item {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #333;
  padding: 12px 16px;
  font-size: 14px;
  display: block;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  border-radius: 6px;
  transition: background-color 0.2s ease, border-radius 0.2s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #FF8700;
  color: #fff;
  border-radius: 5px;
}

.dropdown-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 135, 0, 0.4);
}

@media (max-width: 600px) {
  .dropdown-content {
    min-width: 120px;
  }
}
