function getClipEnd(clip) {
  return clip.cutFrom + (clip.end - clip.position);
}

function getClipAudioString(clip, index) {
  const adelay = clip.position * 1000;
  const audioConcatInput = `[a${index}]`;
  const audioStringPart = `[${index}:a]volume=${clip.volume},atrim=start=${
    clip.cutFrom
  }:end=${getClipEnd(clip)},adelay=${adelay}|${adelay},asetpts=PTS-STARTPTS${audioConcatInput};`;

  return {
    audioStringPart,
    audioConcatInput,
  };
}

module.exports = {
  getClipEnd,
  getClipAudioString,
};
