if(!window.contentScriptInjected) {
  window.contentScriptInjected = true;
  const d = 3; // border width
  
  // Create UI elements
  const createUI = () => {
    const ui = document.createElement("div");
    ui.setAttribute("id", "hiresuidiv");
    
    // Header with app name
    const header = document.createElement("div");
    header.classList.add("uhd-extension-header");
    
    const headerContent = document.createElement("div");
    headerContent.classList.add("uhd-extension-header-content");
    
    const headerIcon = document.createElement("div");
    headerIcon.classList.add("uhd-extension-header-icon");
    headerIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M0 0h24v24H0z" fill="none"/>
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>`;
    
    const appTitle = document.createElement("h1");
    appTitle.innerText = "HD Screenshot";
    
    headerContent.appendChild(headerIcon);
    headerContent.appendChild(appTitle);
    header.appendChild(headerContent);
    
    const topDiv = document.createElement("div");
    topDiv.setAttribute("id", "topDiv");
    
    const bottomDiv = document.createElement("div");
    bottomDiv.setAttribute("id", "bottomDiv");
    
    // Magnification slider
    const sliderContainer = document.createElement("div");
    sliderContainer.classList.add("uhd-extension-slider-container");
    
    const sliderLabel = document.createElement("div");
    sliderLabel.classList.add("uhd-extension-slider-label");
    
    const sliderLabelText = document.createElement("span");
    sliderLabelText.innerText = "Magnification";
    
    const sliderValue = document.createElement("span");
    sliderValue.setAttribute("id", "slider-value");
    sliderValue.innerText = "5x";
    
    sliderLabel.appendChild(sliderLabelText);
    sliderLabel.appendChild(sliderValue);
    
    // Create custom slider
    const customSlider = document.createElement("div");
    customSlider.classList.add("uhd-extension-custom-slider");
    
    const sliderFill = document.createElement("div");
    sliderFill.classList.add("uhd-extension-slider-fill");
    sliderFill.style.width = "0%"; // Will be updated on init
    
    const sliderThumb = document.createElement("div");
    sliderThumb.classList.add("uhd-extension-slider-thumb");
    sliderThumb.style.left = "0%"; // Will be updated on init
    
    const slider = document.createElement("input");
    slider.setAttribute("id", "highresuiprecisionselector");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "5");
    slider.setAttribute("max", "20");
    slider.setAttribute("step", "1");
    slider.setAttribute("value", "5");
    
    customSlider.appendChild(sliderFill);
    customSlider.appendChild(sliderThumb);
    customSlider.appendChild(slider);
    
    // Function to update slider visuals
    const updateSliderVisuals = (value) => {
      const percent = ((value - 5) / 15) * 100;
      sliderThumb.style.left = `${percent}%`;
      sliderFill.style.width = `${percent}%`;
    };
    
    slider.oninput = function() {
      const val = this.value;
      sliderValue.innerText = val + "x";
      
      // Update slider visuals
      updateSliderVisuals(parseInt(val));
      
      // Store the value with x suffix for compatibility with existing code
      this.dataset.value = val + "x";
      
      // Update active preset button
      if (activePresetBtn) {
        activePresetBtn.classList.remove("active");
        activePresetBtn = null;
      }
      
      // Find and activate matching preset button if value matches a preset
      presets.forEach((preset, index) => {
        if (parseInt(val) === preset) {
          const presetBtn = presetButtons.children[index];
          presetBtn.classList.add("active");
          activePresetBtn = presetBtn;
        }
      });
    };
    
    // Initialize the slider
    slider.dataset.value = "5x";
    updateSliderVisuals(5); // Initialize with default value
    
    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(customSlider);
    
    // Magnification presets
    const presetContainer = document.createElement("div");
    presetContainer.classList.add("uhd-extension-preset-container");
    
    const presetLabel = document.createElement("div");
    presetLabel.classList.add("uhd-extension-preset-label");
    presetLabel.innerText = "Quick presets";
    
    const presetButtons = document.createElement("div");
    presetButtons.classList.add("uhd-extension-preset-buttons");
    
    let activePresetBtn = null;
    const presets = [5, 10, 15, 20];
    presets.forEach(preset => {
      const presetBtn = document.createElement("button");
      presetBtn.classList.add("uhd-extension-preset-btn");
      presetBtn.innerText = preset + "x";
      
      // Mark the default preset button as active
      if (preset === 5) {
        presetBtn.classList.add("active");
        activePresetBtn = presetBtn;
      }
      
      presetBtn.onclick = () => {
        // Remove active class from previous button
        if (activePresetBtn) {
          activePresetBtn.classList.remove("active");
        }
        
        // Add active class to clicked button
        presetBtn.classList.add("active");
        activePresetBtn = presetBtn;
        
        // Update slider
        slider.value = preset;
        updateSliderVisuals(preset);
        
        slider.dataset.value = preset + "x";
        sliderValue.innerText = preset + "x";
      };
      presetButtons.appendChild(presetBtn);
    });
    
    presetContainer.appendChild(presetLabel);
    presetContainer.appendChild(presetButtons);
    
    // Start Screenshot button
    const startBtn = document.createElement("button");
    startBtn.setAttribute("id", "startScreenshotButton");
    startBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><circle cx="12" cy="13" r="3.5"/></svg><span>Capture Screenshot</span>';
    startBtn.classList.add("uhd-extension-primary-btn", "uhd-extension-ripple");
    
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.setAttribute("id", "cancelButton");
    cancelBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><span>Cancel</span>';
    cancelBtn.classList.add("uhd-extension-secondary-btn", "uhd-extension-ripple");
    
    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("uhd-extension-button-container");
    buttonContainer.appendChild(startBtn);
    buttonContainer.appendChild(cancelBtn);
    
    // Instruction text with icon
    const instructionText = document.createElement("div");
    instructionText.setAttribute("id", "emailText");
    instructionText.classList.add("uhd-extension-instruction-text");
    instructionText.innerHTML = '<span>Click <strong>Capture Screenshot</strong> and select the area</span>';
    
    // CSS styling
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');
      
      #hiresuidiv * {
          font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, sans-serif;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      #hiresuidiv {
          all: revert;
          --teal-dark: #2A6B74;
          --teal-medium: #90C4C1;
          --teal-light: #B5D8D7;
          --orange-medium: #D39987;
          --orange-light: #F4D8CF;
          --bg-light: #F0F4F4;
          --text-dark: #1A1A2E;
          --text-medium: #232334;
          --text-light: #666666;
          --dark-blue: #1A3A54;
          --bright-blue: #1E5B9B;
          --light-green: #A8D8A8;
          
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, sans-serif;
          line-height: 1.5;
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: var(--bg-light);
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25), 
                      0 6px 30px rgba(0, 0, 0, 0.15),
                      0 0 0 1px rgba(0, 0, 0, 0.05),
                      0 20px 60px rgba(0, 0, 0, 0.15),
                      0 30px 100px rgba(0, 0, 0, 0.12),
                      0 0 80px 20px rgba(0, 0, 0, 0.08);
          z-index: 2147483646;
          width: 340px;
          color: var(--text-dark);
          overflow: hidden;
          border: 1px solid #DFE4E4;
      }
      
      .uhd-extension-header {
          background: var(--teal-medium);
          background: linear-gradient(135deg, var(--teal-medium) 0%, #7DB5B1 100%);
          padding: 24px 20px;
          border-radius: 15px 15px 0 0;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
      
      .uhd-extension-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%);
          pointer-events: none;
      }
      
      .uhd-extension-header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
      }
      
      .uhd-extension-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          margin-right: 12px;
          color: var(--bright-blue);
      }
      
      .uhd-extension-header h1 {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          color: var(--bright-blue);
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
      }

      #topDiv {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 22px 20px;
      }

      .uhd-extension-slider-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
      }

      .uhd-extension-slider-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-dark);
      }

      #slider-value {
          font-weight: 600;
          color: white;
          background-color: var(--orange-medium);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
      }
      
      .uhd-extension-custom-slider {
          position: relative;
          height: 14px;
          width: 100%;
          border-radius: 7px;
          background: #DFE4E4;
          margin: 10px 0;
      }
      
      .uhd-extension-slider-fill {
          position: absolute;
          height: 100%;
          left: 0;
          top: 0;
          background-color: var(--teal-medium);
          border-radius: 7px 0 0 7px;
          pointer-events: none;
      }
      
      .uhd-extension-slider-thumb {
          width: 26px;
          height: 26px;
          position: absolute;
          top: 50%;
          border-radius: 50%;
          background: var(--teal-medium);
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          z-index: 2;
      }
      
      .uhd-extension-slider-thumb:hover {
          background-color: #067b8e;
          transform: translate(-50%, -50%) scale(1.05);
      }
      
      input[type="range"] {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 1;
          margin: 0;
      }

      .uhd-extension-preset-container {
          margin-top: 10px;
          margin-bottom: 24px;
      }
      
      .uhd-extension-preset-label {
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-dark);
      }
      
      .uhd-extension-preset-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
      }
      
      .uhd-extension-preset-btn {
          background-color: #E7EDED;
          border: none;
          color: var(--text-medium);
          border-radius: 8px;
          padding: 8px 0;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      
      .uhd-extension-preset-btn:hover {
          background-color: var(--orange-medium);
          color: white;
      }
      
      .uhd-extension-preset-btn.active {
          background-color: var(--orange-light);
          color: var(--text-dark);
      }

      .uhd-extension-button-container {
          display: flex;
          gap: 14px;
          margin-top: 20px;
      }
      
      .uhd-extension-button-container button {
          display: flex;
          align-items: center;
          justify-content: center;
      }
      
      .uhd-extension-button-container .uhd-extension-primary-btn {
          flex: 2;
      }
      
      .uhd-extension-button-container .uhd-extension-secondary-btn {
          flex: 1;
      }
      
      button {
          border-radius: 10px;
          padding: 8px 16px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
          height: 35px;
          white-space: nowrap;
      }
      
      button svg {
          flex-shrink: 0;
          position: relative;
          top: -1px;
      }

      .uhd-extension-ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: width 0.3s, height 0.3s, opacity 0.3s;
      }

      .uhd-extension-ripple:active::after {
          width: 200px;
          height: 200px;
          opacity: 1;
          transition: 0s;
      }

      .uhd-extension-primary-btn {
          background-color: var(--orange-medium);
          color: white;
      }

      .uhd-extension-primary-btn:hover {
          background-color: #BC7E6E;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(211, 153, 135, 0.4);
      }

      .uhd-extension-primary-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(211, 153, 135, 0.3);
      }

      .uhd-extension-secondary-btn {
          background-color: #E7EDED;
          color: var(--text-medium);
      }

      .uhd-extension-secondary-btn:hover {
          background-color: #D3D8D8;
          transform: translateY(-1px);
      }

      .uhd-extension-secondary-btn:active {
          transform: translateY(0);
      }

      button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
      }

      #bottomDiv {
          padding: 16px 20px;
          font-size: 14px;
          color: var(--text-light);
          background-color: white;
          border-top: 1px solid #DFE4E4;
      }
      
      .uhd-extension-instruction-text {
          display: flex;
          align-items: center;
          gap: 8px;
      }
      
      .uhd-extension-instruction-text svg {
          flex-shrink: 0;
          color: var(--teal-medium);
      }

      #hiresloader {
          border: 3px solid rgba(144, 196, 193, 0.3);
          border-top: 3px solid var(--teal-medium);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
          display: none;
      }

      #hiresloader.loading {
          display: block;
      }

      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }

      #hiresboxdiv {
          border-radius: 4px !important;
          transition: all 0.1s ease-out !important;
          border: dashed ${d}px var(--teal-medium) !important;
          transition: box-shadow 0.3s ease !important;
      }
      
      #hiresboxdiv:hover {
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65) !important;
      }

      #hireslabeldiv {
          border-radius: 8px !important;
          font-family: 'Google Sans', Roboto, sans-serif !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
          background-color: white !important;
          color: var(--text-dark) !important;
          border: 1px solid var(--teal-light) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08) !important;
          font-weight: 500 !important;
      }

      a {
          color: var(--teal-medium);
          text-decoration: none;
      }

      a:hover {
          text-decoration: underline;
      }
    `;
    
    // Assemble the UI
    ui.appendChild(header);
    topDiv.appendChild(sliderContainer);
    topDiv.appendChild(presetContainer);
    topDiv.appendChild(buttonContainer);
    topDiv.appendChild(style);
    
    bottomDiv.appendChild(instructionText);
    
    ui.appendChild(topDiv);
    ui.appendChild(bottomDiv);
    
    document.body.appendChild(ui);
    
    return { 
      ui,
      startBtn,
      cancelBtn
    };
  };
  
  let isActive = false;
  
  // Main function
  chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    if (message.action === "ACTIVATE") {
      if (isActive) return;
      isActive = true;
      
      // Create the UI
      const { ui, startBtn, cancelBtn } = createUI();
      
      // Create box for screenshot
      const boxDiv = document.createElement("div");
      boxDiv.setAttribute("id", "hiresboxdiv");
      
      const labelDiv = document.createElement("div");
      labelDiv.setAttribute("id", "hireslabeldiv");
      boxDiv.appendChild(labelDiv);
      
      const overlayDiv = document.createElement("div");
      
      // Add box to the DOM
      document.body.appendChild(boxDiv);
      boxDiv.style.display = "none";
      boxDiv.style.border = `dashed ${d}px rgba(139, 92, 246, 0.8)`;
      boxDiv.style.boxSizing = "content-box";
      boxDiv.style.position = "fixed";
      boxDiv.style.zIndex = "2147483647";
      boxDiv.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.6)";
      
      labelDiv.style.position = "absolute";
      labelDiv.style.background = "rgba(31, 41, 55, 0.95)";
      labelDiv.style.color = "#F9FAFB";
      labelDiv.style.border = "1px solid rgba(255, 255, 255, 0.1)";
      labelDiv.style.width = "max-content";
      
      let styleSheets = [];
      let isDragging = false;
      let startX, startY;
      let isSelectionMade = false;
      
      // Event handlers
      const stopEventPropagation = e => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      
      const handleMouseDown = e => {
        if (!e.target.matches("#hiresuidiv, #hiresuidiv *")) {
          document.body.style.userSelect = "none";
          startX = e.clientX;
          startY = e.clientY;
          isSelectionMade = false;
          isDragging = true;
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };
      
      const handleMouseMove = r => {
        if (r.stopPropagation(), r.stopImmediatePropagation(), isDragging) {
          var a = document.querySelector("#highresuiprecisionselector").dataset.value;
          var s = (isSelectionMade = true, Math.min(startX, r.clientX));
          var l = Math.max(startX, r.clientX);
          var c = Math.min(startY, r.clientY);
          let e = l - s;
          var l = Math.max(startY, r.clientY) - c;
          
          boxDiv.style.display = "block";
          boxDiv.style.width = e + "px";
          boxDiv.style.height = l + "px";
          boxDiv.style.top = c - d + "px";
          boxDiv.style.left = s - d + "px";
          
          let t = parseInt(document.querySelector("#highresuiprecisionselector").value);
          let i = window.devicePixelRatio;
          
          let o = Math.floor(e * t);
          var n = Math.floor(l * t);
          
          labelDiv.style.bottom = 5 + l + "px";
          labelDiv.style.left = e + 5 + "px";
          labelDiv.innerHTML = `<span style="color: #1E5B9B; font-weight: 500;">Visible:</span> <span style="color: #1E5B9B;">${(e * i).toFixed(0)} × ${(l * i).toFixed(0)}</span><br><span style="color: #1E5B9B; font-weight: 500;">Output:</span> <span style="color: #1E5B9B;">${o * i} × ${n * i}</span>`;
        }
      };
      
      const handleMouseOver = e => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      
      // Start Screenshot button handler
      startBtn.onclick = function() {
        // Initialize crosshair cursor and event listeners
        overlayDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: auto;
          z-index: 2147483647;
          background: transparent;
        `;
        document.body.appendChild(overlayDiv);
        
        const cursorStyle = document.createElement("style");
        cursorStyle.innerHTML = "* { cursor: crosshair !important; transition: 2147483647s !important; scrollbar-width: none; } #hiresboxdiv, body, #hireslabeldiv { transition: 0s !important; } #hiresuidiv, #hiresuidiv * { cursor: auto !important; } #hiresuidiv button { cursor: pointer !important; }";
        cursorStyle.id = "cursor-style";
        document.head.appendChild(cursorStyle);
        
        Array.from(document.getElementsByTagName("*"))
          .filter(e => e.shadowRoot)
          .forEach(e => {
            var t = new CSSStyleSheet;
            t.replaceSync(cursorStyle.innerHTML);
            styleSheets.push(t);
            e.shadowRoot.adoptedStyleSheets.push(t);
          });
        
        document.addEventListener("mousedown", handleMouseDown, {capture: true, useCapture: true});
        document.addEventListener("click", stopEventPropagation, {capture: true, useCapture: true});
        document.addEventListener("mousemove", handleMouseMove, {capture: true, useCapture: true});
        document.addEventListener("mouseover", handleMouseOver, {capture: true, useCapture: true});
        document.addEventListener("mouseup", handleMouseUp, {capture: true, useCapture: true});
        
        // Hide the UI when starting screenshot
        ui.style.display = "none";
      };

      // Cancel button handler
      cancelBtn.onclick = function() {
        cleanUp();
      };
      
      // Escape key handler
      document.onkeydown = function(e) {
        if ("key" in (e = e || window.event) ? "Escape" === e.key || "Esc" === e.key : 27 === e.keyCode) {
          cleanUp();
        }
      };
      
      // Handle cleanup
      function cleanUp() {
        ui.remove();
        boxDiv.remove();
        
        if (document.getElementById("hireslabeldiv")) {
          overlayDiv.remove();
        }
        
        if (document.getElementById("cursor-style")) {
          const cursorStyle = document.getElementById("cursor-style");
          cursorStyle.remove();
        }
        
        Array.from(document.getElementsByTagName("*"))
          .filter(e => e.shadowRoot)
          .forEach((e, t) => {
            if (t < styleSheets.length) {
              const idx = e.shadowRoot.adoptedStyleSheets.indexOf(styleSheets[t]);
              if (idx >= 0) {
                e.shadowRoot.adoptedStyleSheets.splice(idx, 1);
              }
            }
          });
        
        document.removeEventListener("mousedown", handleMouseDown, {capture: true, useCapture: true});
        document.removeEventListener("click", stopEventPropagation, {capture: true, useCapture: true});
        document.removeEventListener("mousemove", handleMouseMove, {capture: true, useCapture: true});
        document.removeEventListener("mouseover", handleMouseOver, {capture: true, useCapture: true});
        document.removeEventListener("mouseup", handleMouseUp, {capture: true, useCapture: true});
        
        isActive = false;
      }
      
      // Function that handles capturing the screenshot
      const handleMouseUp = async s => {
        s.stopPropagation();
        s.stopImmediatePropagation();
        isDragging = false;
        boxDiv.style.display = "none";
        
        if (isSelectionMade) {
          var d = Math.min(startX, s.clientX);
          var l = Math.max(startX, s.clientX);
          var c = Math.min(startY, s.clientY);
          var u = Math.max(startY, s.clientY);
          
          if (d - l != 0 && c - u != 0) {
            let e = l - d;
            l = u - c;
            
            let n = parseInt(document.querySelector("#highresuiprecisionselector").value);
            
            var p = Math.min(document.body.clientWidth, document.documentElement.clientWidth) - 60;
            var m = Math.min(document.body.clientHeight, document.documentElement.clientHeight) - 60;
            var h = (e * n).toFixed(0);
            var u = (l * n).toFixed(0);
            var g = Math.ceil(h / p) - 1;
            l = Math.ceil(u / m) - 1;
            
            const A = document.createElement("style");
            const T = c - (window.scrollY + document.body.getBoundingClientRect().top);
            const k = d - (window.scrollX + document.body.getBoundingClientRect().left);
            
            var v, x, y, f, b;
            var w = t => new Promise(e => setTimeout(e, t));
            
            alert("After clicking OK, please wait until the save file dialog has appeared before interacting with your browser again, otherwise the screenshot will be disturbed.");
            
            let t, i, o, r = "";
            
            if (window.location.href.includes("previewed.app")) {
              v = document.querySelector("canvas");
              i = v.width;
              o = v.height;
              t = v.parentElement;
              x = (t.parentElement.clientHeight - t.clientHeight) / 2;
              y = (t.parentElement.clientWidth - t.clientWidth) / 2;
              f = i / t.clientWidth;
              b = o * i;
              b = Math.sqrt(33177600 / b) / f - .1;
              t.style.width = v.width * b + "px";
              t.style.height = v.height * b + "px";
              
              await w(500);
              await new Promise(t => window.requestAnimationFrame(e => window.requestAnimationFrame(e => window.requestAnimationFrame(t))));
              
              t.style.display = "none";
              t.offsetHeight;
              t.style.display = "block";
              t.style.marginTop = x + "px";
              t.style.marginLeft = y + "px";
              t.style.transformOrigin = "top left";
              t.style.scale = i / v.width;
              
              await w(500);
              await new Promise(t => window.requestAnimationFrame(e => window.requestAnimationFrame(t)));
            }
            
            await new Promise(t => window.requestAnimationFrame(e => window.requestAnimationFrame(t)));
            
            A.innerHTML = `
            body {
              transform-origin: ${window.scrollX + k}px ${T + window.scrollY}px;
              transform: translate(-${d}px, -${c}px) scale(${n});
            }
            `;
            
            document.body.appendChild(A);
            
            try {
              r = document.getElementsByName("viewport")[0].getAttribute("content");
              var E = r.replace("user-scalable=0", "user-scalable=1");
              document.getElementsByName("viewport")[0].setAttribute("content", E);
            } catch (s) {}
            
            ui.remove();
            await w(1000);
            
            var S = (e, t) => {
              var { x: i, y: o } = "none" !== (i = window.getComputedStyle(document.body).transform) && 
              (i = i.match(/matrix\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/)) ? 
              { x: parseFloat(i[5]), y: parseFloat(i[6]) } : { x: 0, y: 0 };
              
              A.innerHTML = `
              body {
                transform-origin: ${window.scrollX + k}px ${T + window.scrollY}px;
                transform: translate(${i - e}px, ${o - t}px) scale(${n});
              }
              `;
            };
            
            var C = (await chrome.runtime.sendMessage({ 
              action: "START", 
              params: { 
                captureWidth: p, 
                captureHeight: m, 
                totalWidth: h, 
                totalHeight: u, 
                leftToRightScrolls: g, 
                upToDownScrolls: l, 
                devicePixelRatio: window.devicePixelRatio 
              } 
            }), 1 + l);
            
            var L = 1 + g;
            let a = 0;
            
            for (let e = 0; e < C; e++) {
              for (let e = 0; e < L; e++) {
                await chrome.runtime.sendMessage({ action: "CAPTURE", unscrolled: a });
                window.scrollX;
                S(p, 0);
                window.scrollX;
                a = 0;
              }
              S(-L * p, m);
              a = 0;
            }
            
            S(-p * (1 + g), -m * (1 + l));
            await chrome.runtime.sendMessage({ action: "END" });
            
            A.remove();
            boxDiv.remove();
            overlayDiv.remove();
            
            if (document.getElementById("cursor-style")) {
              const cursorStyle = document.getElementById("cursor-style");
              cursorStyle.remove();
            }
            
            Array.from(document.getElementsByTagName("*"))
              .filter(e => e.shadowRoot)
              .forEach((e, t) => {
                if (t < styleSheets.length) {
                  const idx = e.shadowRoot.adoptedStyleSheets.indexOf(styleSheets[t]);
                  if (idx >= 0) {
                    e.shadowRoot.adoptedStyleSheets.splice(idx, 1);
                  }
                }
              });
            
            try {
              document.getElementsByName("viewport")[0].setAttribute("content", r);
            } catch (s) {}
            
            document.removeEventListener("mousedown", handleMouseDown, {capture: true, useCapture: true});
            document.removeEventListener("click", stopEventPropagation, {capture: true, useCapture: true});
            document.removeEventListener("mousemove", handleMouseMove, {capture: true, useCapture: true});
            document.removeEventListener("mouseover", handleMouseOver, {capture: true, useCapture: true});
            document.removeEventListener("mouseup", handleMouseUp, {capture: true, useCapture: true});
            
            isActive = false;
            
            if (window.location.href.includes("previewed.app")) {
              t.style.width = i + "px";
              t.style.height = o + "px";
              await new Promise(t => window.requestAnimationFrame(e => window.requestAnimationFrame(e => window.requestAnimationFrame(t))));
              t.style.display = "none";
              t.offsetHeight;
              t.style.display = "block";
              t.style.marginTop = "";
              t.style.marginLeft = "";
              t.style.transformOrigin = "";
              t.style.scale = "";
            }
          }
        }
      };
    }
  });
}