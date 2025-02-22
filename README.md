# ezffmpeg

A simple and powerful Node.js library that wraps ffmpeg to make video editing easier. This library provides an intuitive API for common video editing operations like concatenation, rotation, scaling, and adding text overlays.

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
      url: "path/to/video1.mp4",
      position: 0,
      end: 2,
    },
    {
      url: "path/to/video2.mp4",
      position: 2,
      end: 5,
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
