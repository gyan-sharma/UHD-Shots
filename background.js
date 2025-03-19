chrome.action.onClicked.addListener(async function (tab) {
    // Check if the URL is compatible
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || 
        tab.url.includes("chrome.google.com/webstore")) {
      // Open error.html for incompatible pages
      chrome.tabs.create({ url: chrome.runtime.getURL("error.html") });
      return;
    }
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["inject.js"],
      });
    } catch (error) {
      console.error("Script injection failed", error);
      // If script injection fails, likely due to permission issues, show error page
      chrome.tabs.create({ url: chrome.runtime.getURL("error.html") });
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { action: "ACTIVATE" });
  });
  
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
  let images = [],
    captureWidth,
    captureHeight,
    totalWidth,
    totalHeight,
    leftToRightScrolls,
    upToDownScrolls;
  
  const start = async (params) => {
    images = [];
    captureWidth = params.captureWidth * params.devicePixelRatio;
    captureHeight = params.captureHeight * params.devicePixelRatio;
    totalWidth = params.totalWidth * params.devicePixelRatio;
    totalHeight = params.totalHeight * params.devicePixelRatio;
    leftToRightScrolls = params.leftToRightScrolls;
    upToDownScrolls = params.upToDownScrolls;
  };
  
  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mimeString });
  }
  
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  const end = async () => {
    try {
      console.log(`Attempting to create image with dimensions: ${totalWidth}x${totalHeight}`);
      
      // Check if dimensions exceed browser limitations
      if (totalWidth > 16384 || totalHeight > 16384) {
        console.warn(`Warning: Image dimensions (${totalWidth}x${totalHeight}) may exceed browser canvas limits`);
      }
      
      const canvas = new OffscreenCanvas(totalWidth, totalHeight);
      const ctx = canvas.getContext("2d");
      
      console.log(`Processing ${images.length} captured screenshots`);
      
      try {
        const bitmaps = await Promise.all(
          images.map((img, idx) => {
            try {
              return createImageBitmap(dataURItoBlob(img.image));
            } catch (err) {
              console.error(`Failed to create bitmap for image ${idx}:`, err);
              throw err;
            }
          })
        );
        
        console.log(`Successfully created ${bitmaps.length} bitmaps`);
        
        bitmaps.forEach((bitmap, index) => {
          try {
            const scrollOffset = images[index].pixelsUnscrolledToRight;
            if (scrollOffset) {
              ctx.drawImage(
                bitmap,
                scrollOffset,
                0,
                bitmap.width - scrollOffset,
                bitmap.height,
                (index % (leftToRightScrolls + 1)) * captureWidth,
                Math.floor(index / (leftToRightScrolls + 1)) * captureHeight,
                bitmap.width - scrollOffset,
                bitmap.height
              );
            } else {
              ctx.drawImage(
                bitmap,
                (index % (leftToRightScrolls + 1)) * captureWidth,
                Math.floor(index / (leftToRightScrolls + 1)) * captureHeight
              );
            }
          } catch (err) {
            console.error(`Failed to draw bitmap ${index}:`, err);
            throw err;
          }
        });
        
        console.log("Successfully composited all images onto canvas");
        
        try {
          const stitchedBlob = await canvas.convertToBlob();
          console.log(`Generated blob of size: ${stitchedBlob.size} bytes`);
          
          const base64Final = await blobToBase64(stitchedBlob);
          console.log("Successfully converted to base64");
          
          // Generate filename with dimensions, date and time
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          
          // Calculate actual output dimensions
          const width = Math.round(totalWidth);
          const height = Math.round(totalHeight);
          const filename = `Screenshot_${width}x${height}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.png`;
          
          console.log(`Initiating download with filename: ${filename}`);
          
          try {
            await chrome.downloads.download({
              url: base64Final,
              filename: filename,
              saveAs: true,
            });
            console.log("Download initiated successfully");
          } catch (err) {
            console.error("Failed to initiate download:", err);
            
            // Try an alternative approach for very large files
            if (err.message && (err.message.includes("too large") || 
                err.message.includes("failed") || 
                err.message.includes("error"))) {
              alert("The screenshot is very large and couldn't be processed. Try capturing a smaller area or at a lower magnification.");
            }
            throw err;
          }
        } catch (err) {
          console.error("Failed during blob conversion or download:", err);
          throw err;
        }
      } catch (err) {
        console.error("Failed during bitmap creation or drawing:", err);
        throw err;
      }
    } catch (err) {
      console.error("Screenshot processing failed:", err);
      alert("Failed to generate screenshot. The image might be too large. Try a smaller area or lower magnification.");
    }
  };
  
  let lastCaptureTime;
  
  const captureScreenshot = async function (unscrolledPixels) {
    if (lastCaptureTime) {
      const waitTime = lastCaptureTime + 600 - Date.now();
      if (waitTime > 0) await sleep(waitTime);
    }
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(
        chrome.windows.WINDOW_ID_CURRENT,
        { format: "png" }
      );
      images.push({ image: dataUrl, pixelsUnscrolledToRight: unscrolledPixels });
      lastCaptureTime = Date.now();
    } catch (error) {
      await sleep(600);
      await captureScreenshot(unscrolledPixels);
    }
  };
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      if (message.action === "START") {
        await start(message.params);
        sendResponse();
      } else if (message.action === "CAPTURE") {
        await captureScreenshot(message.unscrolled);
        sendResponse();
      } else if (message.action === "END") {
        await end();
        sendResponse();
      }
    })();
    return true; // Keep the message channel open
  });