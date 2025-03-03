# ezffmpeg - the eziest way to use ffmpeg

A simple and powerful Node.js library that wraps ffmpeg to make video editing easier.

## Features

- 🎥 Easy video concatenation
- 📐 Video scaling and padding
- 🔊 Audio processing and volume control
- 0️⃣ Zero dependencies besides ffmpeg
- 💬 Text overlay support
- 🎯 Position and timing control
- 🎨 Font customization and text effects

## Installation

```bash
npm install ezffmpeg
```

Make sure you have ffmpeg installed on your system:

- **Mac**: `brew install ffmpeg`
- **Ubuntu/Debian**: `apt-get install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Quick Start

```javascript
const EZFFMPEG = require("ezffmpeg");

const project = new EZFFMPEG({
  width: 1080,
  height: 1920,
});

// Load video clips
project
  .loadMultiple([
    {
      type: "video",
      url: "path/to/cat.mp4",
      position: 0,
      end: 3,
    },
    {
      type: "video",
      url: "path/to/cat2.mp4",
      position: 3,
      end: 6,
    },
    {
      type: "audio",
      url: "path/to/music.mp4",
      position: 0,
      end: 6,
    },
    {
      type: "text",
      text: "this is so ez",
      position: 0,
      end: 3,
      fontSize: 50,
      fontColor: "white",
      borderWidth: 5,
      borderColor: "#000000",
    },
  ])
  .then(() => {
    // export the project
    project.export({
      outputPath: "./output.mp4",
    });
  });
```

## Documentation

Find the full API documentation [here](https://github.com/yourusername/ezffmpeg/blob/main/docs/api.md).
