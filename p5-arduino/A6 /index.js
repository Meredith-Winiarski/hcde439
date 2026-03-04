let port; //declare serial connection betweem browser and arduino
let reader; //declare reader to read data from arduino
let writer; //declare writer to send data to arduino
let redState = 0; //declare state of red LED to be 0
let blueState = 0; //declare state of blue LED to be 0
let serialBuffer = ""; // buffer for incoming serial data

// p5.js setup
function setup() { //create setup function 
  createCanvas(windowWidth, windowHeight); //create a canvas that is the size of the screen/window
  background(255,255,255); //make the canvas background white

  // Connect button
  const connectBtn = document.getElementById("connectBtn"); // connects to HTML button
  const statusText = document.getElementById("status"); // connects to HTML status text

  connectBtn.addEventListener("click", async () => { //button creates a connection to serial port
    try {
      port = await navigator.serial.requestPort(); //opens connect to arduino pop-up
      await port.open({ baudRate: 9600 }); //sets baud rate to 9600 to match arduino

      writer = port.writable.getWriter(); // for sending data

      const decoder = new TextDecoderStream(); // tool to decode data
      port.readable.pipeTo(decoder.writable); //sends incoming data to decoder
      reader = decoder.readable.getReader(); //reads decoded data

      statusText.textContent = "Connected!"; // update status text if arduino successfully connected

      await sendBrightness(0);  // send initial brightness value to arduino
      readSerial(); // start reading serial
    } catch (err) { //catches errors
      console.error("Failed to connect:", err); // prints error message to console
      statusText.textContent = "Failed to connect"; // update status text if arduino failed to connect

    }
  });

  const slider = document.getElementById("sliderA"); // connects to HTML slider
  const valueDisplay = document.getElementById("valueA"); // connects to HTML value display

  slider.addEventListener("input", async () => { // listens for slider input changes
    valueDisplay.textContent = slider.value; // shows current value in text
    await sendBrightness(Number(slider.value)); //sends brightness number to arduino
  });

  frameRate(30); // limit draw updates
}

// Read serial data from Arduino
async function readSerial() { //receiving data from ardiuno
  while (true) { //setup constant data "listening"
    try { 
      const { value, done } = await reader.read(); // read in serial data and check that there is still data to read
      if (done) break; //if reading is done, break the loop
      if (!value) continue; //if there is still reading to be done, keep the loop open

      serialBuffer += value; // append incoming data to buffer
      const lines = serialBuffer.split("\n"); // split buffer at new line element

      for (let i = 0; i < lines.length - 1; i++) { // iterate through all complete lines
        const line = lines[i].trim().replace("\r", ""); // clean up line
        const parts = line.split(","); //split first data at the comma
        if (parts.length >= 2) { // check if there are at least two parts
          redState = Number(parts[0]); // set the first value to indicate the state of the red LED
          blueState = Number(parts[1]); //set the second value to indicate the state of the blue LED
        }
      }

      serialBuffer = lines[lines.length - 1]; //saves any unfinished data chunks
    } catch (err) { //catches errors
      console.error("Serial read error:", err); //print error to console
      break; //stop the loop
    }
  }
}

// Send slider  brightness value to Arduino
async function sendBrightness(value) { //fucntion to send brightness toa rduino
  if (!port || !writer) return; //check that everything is connected

  const msg = `${value}\n`; // create message string with newline
  await writer.write(new TextEncoder().encode(msg)); //convert string to bytes and send to arduino
}

// p5.js draw loop
function draw() { //draw function
 
  if (mouseIsPressed) { //if the mouse is pressed

    if (redState === 1 && blueState === 1) { //if both red and blue LEDs are on
      fill(150, 0, 150); //set fill color to purple
    } else if (redState === 1) { //if only red is on
      fill(255, 0, 0); //set ink color to red
    } else if (blueState === 1) { //if only red is on
      fill(0, 0, 255); //set ink color to blue
    } else { // if neither are on
      fill(255); //set the fill color to white
    }

    circle(mouseX, mouseY, 40); //drawing shape is a circle with a diameter of 40
  }

}