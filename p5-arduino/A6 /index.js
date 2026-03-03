let port;
let reader;
let writer;
let redState = 0;
let blueState = 0;
let serialBuffer = "";

// p5.js setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255,255,255);

  textAlign(CENTER, CENTER);
  textSize(32);
  fill("white");

  // Connect button
  const connectBtn = document.getElementById("connectBtn");
  const statusText = document.getElementById("status");

  connectBtn.addEventListener("click", async () => {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      writer = port.writable.getWriter(); // for sending data

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      reader = decoder.readable.getReader();

      statusText.textContent = "Connected!";

      await sendBrightness(0);  
      readSerial(); // start reading serial
    } catch (err) {
      console.error("Failed to connect:", err);
      statusText.textContent = "Failed to connect";
    }
  });

  // Slider event
  const slider = document.getElementById("sliderA");
  const valueDisplay = document.getElementById("valueA");

  slider.addEventListener("input", async () => {
    valueDisplay.textContent = slider.value;
    await sendBrightness(Number(slider.value));
  });

  frameRate(30); // limit draw() updates
}

// Read serial data from Arduino
async function readSerial() {
  while (true) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      serialBuffer += value;
      const lines = serialBuffer.split("\n");

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim().replace("\r", "");
        const parts = line.split(",");
        if (parts.length >= 2) {
          redState = Number(parts[0]);
          blueState = Number(parts[1]);
        }
      }

      serialBuffer = lines[lines.length - 1];
    } catch (err) {
      console.error("Serial read error:", err);
      break;
    }
  }
}

// Send slider value to Arduino
async function sendBrightness(value) {
  if (!port || !writer) return;

  // Send the brightness value as integer + newline
  const msg = `${value}\n`;
  await writer.write(new TextEncoder().encode(msg));
}

// p5.js draw loop
function draw() {
 
  // Set circle color based on LED states

  if (mouseIsPressed) {

    if (redState === 1 && blueState === 1) {
      fill(150, 0, 150);
    } else if (redState === 1) {
      fill(255, 0, 0);
    } else if (blueState === 1) {
      fill(0, 0, 255);
    } else {
      fill(255);
    }

    circle(mouseX, mouseY, 40);
  }

}