const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");
const { exec } = require("child_process");
const Helpers = require("./_helpers");
const tempDir = os.tmpdir();

class EZFFMPEG {
  constructor(options) {
    this.options = {
      fps: options.fps || 30,
      width: options.width || 1920,
      height: options.height || 1080,
    };
    this.videoOrAudioClips = [];
    this.textClips = [];
    this.filesToClean = [];
  }

  _getInputStreams() {
    return this.videoOrAudioClips
      .map((clip) => {
        return `-i "${clip.url}"`;
      })
      .join(" ");
  }

  _getTranspose(rotation) {
    if (rotation === 90) {
      return "1";
    }
    if (rotation === -90) {
      return "2";
    }
    if (rotation === 180) {
      return "3";
    }
    return "0";
  }

  _getVideoMetadata(url) {
    return new Promise((resolve, reject) => {
      // Get all stream info in one command
      const cmd = `ffprobe -v error -show_streams -of json "${url}"`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("Error getting video metadata:", error);
          resolve({
            rotation: 0,
            hasAudio: false,
            width: null,
            height: null,
          });
          return;
        }

        try {
          const metadata = JSON.parse(stdout);

          const videoStream = metadata.streams.find(
            (stream) => stream.codec_type === "video"
          );
          const hasAudio = metadata.streams.some(
            (stream) => stream.codec_type === "audio"
          );
          // Extract rotation value if it exists
          const iphoneRotation = videoStream?.side_data_list?.[0]?.rotation
            ? videoStream.side_data_list[0].rotation
            : 0;

          resolve({
            iphoneRotation,
            hasAudio,
            width: videoStream?.width,
            height: videoStream?.height,
          });
        } catch (parseError) {
          console.error("Error parsing metadata:", parseError);
          resolve({
            iphoneRotation: 0,
            hasAudio: false,
            width: null,
            height: null,
          });
        }
      });
    });
  }

  _unrotateVideo(clipObj) {
    return new Promise((resolve, reject) => {
      const unrotatedUrl = path.join(tempDir, `unrotated-${randomUUID()}.mp4`);

      let ffmpegCommand = `ffmpeg -y -i "${clipObj.url}" "${unrotatedUrl}"`;

      console.log("Unrotating:", ffmpegCommand);
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          console.error("Error unrotating video:", error);
          reject(error);
        }
        resolve(unrotatedUrl);
      });
    });
  }

  _cleanup() {
    this.filesToClean.forEach((file) => {
      fs.unlink(file, (error) => {
        if (error) {
          console.error("Error cleaning up file:", error);
        } else {
          console.log("File cleaned up:", file);
        }
      });
    });
  }

  async _loadVideo(clipObj) {
    const metadata = await this._getVideoMetadata(clipObj.url);

    this.videoOrAudioClips.push({
      ...clipObj,
      iphoneRotation: metadata.iphoneRotation,
      hasAudio: metadata.hasAudio,
    });
  }

  _loadAudio(clipObj) {
    this.videoOrAudioClips.push(clipObj);
  }

  _loadText(clipObj) {
    this.textClips.push({
      ...clipObj,
      fontFile: clipObj.fontFile || "./fonts/Arial-Bold.ttf",
      fontSize: clipObj.fontSize || 100,
      fontColor: clipObj.fontColor || "#000000",
      centerX: clipObj.centerX || 0,
      centerY: clipObj.centerY || 0,
    });
  }

  load(clipObjs) {
    return Promise.all(
      clipObjs.map((clipObj) => {
        if (clipObj.type === "video" || clipObj.type === "audio") {
          clipObj.volume = clipObj.volume || 1;
          clipObj.cutFrom = clipObj.cutFrom || 0;
        }

        if (clipObj.type === "video") {
          return this._loadVideo(clipObj);
        }
        if (clipObj.type === "audio") {
          return this._loadAudio(clipObj);
        }
        if (clipObj.type === "text") {
          return this._loadText(clipObj);
        }
      })
    );
  }

  export(options) {
    const exportOptions = {
      outputPath: options.outputPath || "./output.mp4",
    };

    return new Promise(async (resolve, reject) => {
      // sort by position
      this.videoOrAudioClips.sort((a, b) => {
        if (!a.position) {
          return -1;
        }

        if (!b.position) {
          return 1;
        }

        if (a.position < b.position) {
          return -1;
        }

        return 1;
      });

      await Promise.all(
        this.videoOrAudioClips.map(async (clip) => {
          if (clip.type === "video" && clip.iphoneRotation !== 0) {
            const unrotatedUrl = await this._unrotateVideo(clip);
            this.filesToClean.push(unrotatedUrl);
            clip.url = unrotatedUrl;
          }
        })
      );

      let filterComplex = "";

      let videoString = "";
      let audioString = "";
      let textString = "";

      let videoConcatInputs = [];
      let audioConcatInputs = [];

      let blackConcatCount = 0;
      let currentPosition = 0;

      this.videoOrAudioClips.forEach((clip, index) => {
        if (clip.type === "video") {
          // see if we need to add a black screen to fill the gap
          if (clip.position > currentPosition) {
            const { blackStringPart, blackConcatInput } =
              Helpers.getBlackString(
                clip.position - currentPosition,
                this.options.width,
                this.options.height,
                blackConcatCount
              );
            videoString += blackStringPart;
            videoConcatInputs.push(blackConcatInput);
            blackConcatCount++;
          }

          videoString += `[${index}:v]trim=start=${
            clip.cutFrom
          }:end=${Helpers.getTrimEnd(clip)},setpts=PTS-STARTPTS,scale=${
            this.options.width
          }:${this.options.height}:force_original_aspect_ratio=decrease,pad=${
            this.options.width
          }:${this.options.height}:(ow-iw)/2:(oh-ih)/2[v${index}];`;
          videoConcatInputs.push(`[v${index}]`);
          if (clip.hasAudio) {
            const { audioStringPart, audioConcatInput } =
              Helpers.getClipAudioString(clip, index);
            audioString += audioStringPart;
            audioConcatInputs.push(audioConcatInput);
          }

          currentPosition = clip.end;

          // check if we need a black screen for the end of the video
          if (index === this.videoOrAudioClips.length - 1) {
            const maxEnd = Math.max(
              ...this.videoOrAudioClips.map((c) => c.end),
              ...this.textClips.map((c) => c.end)
            );
            if (currentPosition < maxEnd) {
              const { blackStringPart, blackConcatInput } =
                Helpers.getBlackString(
                  maxEnd - currentPosition,
                  this.options.width,
                  this.options.height,
                  blackConcatCount
                );
              videoString += blackStringPart;
              videoConcatInputs.push(blackConcatInput);
              blackConcatCount++;
              currentPosition = maxEnd;
            }
          }
        }

        if (clip.type === "audio") {
          const { audioStringPart, audioConcatInput } =
            Helpers.getClipAudioString(clip, index);
          audioString += audioStringPart;
          audioConcatInputs.push(audioConcatInput);
        }
      });

      filterComplex += videoString;
      filterComplex += audioString;

      let combinedVideoName = "[outv]";

      if (videoConcatInputs.length > 0) {
        filterComplex += videoConcatInputs.join("");
        filterComplex += `concat=n=${videoConcatInputs.length}:v=1:a=0${combinedVideoName};`;
      }

      if (audioConcatInputs.length > 0) {
        filterComplex += audioConcatInputs.join("");
        filterComplex += `amix=inputs=${audioConcatInputs.length}:duration=longest[outa];`;
      }

      if (this.textClips.length > 0) {
        textString += `${combinedVideoName}`;

        this.textClips.forEach((clip, index) => {
          textString += `drawtext=text='${Helpers.escapeSingleQuotes(
            clip.text
          )}':fontfile=${clip.fontFile}
          :fontsize=${clip.fontSize}:fontcolor=${
            clip.fontColor
          }:enable='between(t,${clip.position},${clip.end})'`;

          if (typeof clip.centerX === "number") {
            textString += `:x=(${this.options.width} - text_w)/2 + ${clip.centerX}`;
          } else if (typeof clip.x === "number") {
            textString += `:x=${clip.x}`;
          }

          if (typeof clip.centerY === "number") {
            textString += `:y=(${this.options.height} - text_h)/2 + ${clip.centerY}`;
          } else if (typeof clip.y === "number") {
            textString += `:y=${clip.y}`;
          }

          if (clip.borderColor) {
            textString += `:bordercolor=${clip.borderColor}`;
          }

          if (clip.borderWidth) {
            textString += `:borderw=${clip.borderWidth}`;
          }

          if (clip.shadowColor) {
            textString += `:shadowcolor=${clip.shadowColor}`;
          }

          if (clip.shadowX) {
            textString += `:shadowx=${clip.shadowX}`;
          }

          if (clip.shadowY) {
            textString += `:shadowy=${clip.shadowY}`;
          }

          if (clip.backgroundColor) {
            textString += `:box=1:boxcolor=${clip.backgroundColor}`;
            if (clip.backgroundOpacity) {
              textString += `@${clip.backgroundOpacity}`;
            }
          }

          if (clip.padding) {
            textString += `:boxborderw=${clip.padding}`;
          }

          if (index === this.textClips.length - 1) {
            textString += `[outVideoAndText];`;
          } else {
            textString += `[text${index}];[text${index}]`;
          }
        });

        combinedVideoName = "[outVideoAndText]";
      }

      filterComplex += textString;

      // Build the complete command
      let ffmpegCmd = `ffmpeg -y ${this._getInputStreams()} -filter_complex "${filterComplex}" `;

      // Add mapping based on what streams we have

      if (videoConcatInputs.length > 0) {
        ffmpegCmd += `-map "${combinedVideoName}" `;
      }

      if (audioConcatInputs.length > 0) {
        ffmpegCmd += `-map "[outa]" `;
      }

      // Add encoding settings
      if (videoConcatInputs.length > 0) {
        ffmpegCmd += `-c:v libx264 -preset medium -crf 23 `;
      }

      if (audioConcatInputs.length > 0) {
        ffmpegCmd += `-c:a aac -b:a 192k `;
      }

      ffmpegCmd += `"${exportOptions.outputPath}"`;

      console.log("Executing ffmpeg command:", ffmpegCmd);

      // Execute ffmpeg
      exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg stderr:", stderr);
          reject(error);
          this._cleanup();
          return;
        }
        resolve(exportOptions.outputPath);
        this._cleanup();
      });
    });
  }
}

module.exports = EZFFMPEG;
