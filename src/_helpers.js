function getTrimEnd(clip) {
  return clip.cutFrom + (clip.end - clip.position);
}

function getClipAudioString(clip, index) {
  const adelay = clip.position * 1000;
  const audioConcatInput = `[a${index}]`;
  const audioStringPart = `[${index}:a]volume=${clip.volume},atrim=start=${
    clip.cutFrom
  }:end=${getTrimEnd(
    clip
  )},adelay=${adelay}|${adelay},asetpts=PTS-STARTPTS${audioConcatInput};`;

  return {
    audioStringPart,
    audioConcatInput,
  };
}

function getBlackString(duration, width, height, index) {
  const blackConcatInput = `[black${index}]`;
  return {
    blackStringPart: `color=c=black:s=${width}x${height}:d=${duration}${blackConcatInput};`,
    blackConcatInput,
  };
}

function escapeSingleQuotes(text) {
  return text.replace(/'/g, "\\'");
}

module.exports = {
  getTrimEnd,
  getClipAudioString,
  getBlackString,
  escapeSingleQuotes,
};
