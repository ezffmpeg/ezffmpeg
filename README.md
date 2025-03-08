![ezffmpeg banner](https://github.com/ezffmpeg/ezffmpeg/blob/main/docs/assets/ezffmpeg-banner.png?raw=true)

A simple and powerful Node.js wrapper for ffmpeg that makes editing videos easy

[Demo](https://ezffmpeg.github.io/ezffmpeg) | [Full Documentation](https://ezffmpeg.github.io/ezffmpeg/docs.html)

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

**1. Require the package**

```javascript
const ezffmpeg = require("ezffmpeg");
```

**2. Create a project**

```javascript
const project = new ezffmpeg({
  width: 1080,
  height: 1920,
});
```

**3. Load clips into project**

```javascript
await project.load([
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
]);
```

**4. Export**

```javascript
await project.export({
  outputPath: "./output.mp4",
});
```


## Documentation

Find the full API documentation [here](https://ezffmpeg.github.io/ezffmpeg).
